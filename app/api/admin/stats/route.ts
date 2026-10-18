import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdminOrOwner } from "@/lib/auth"
import { loadSystemConfig } from "@/lib/system-config"
import { syncExpiredSeminars } from "@/lib/seminar-sync"

export async function GET(req: NextRequest) {
  const auth = await verifyAdminOrOwner(req)
  if (!auth.valid) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })
  
  const config = loadSystemConfig()
  if (!config.statsVisibilityEnabled && auth.role !== "ROOT") {
    return NextResponse.json({ error: "Sistem şu anda ROOT tarafından kilitlendi." }, { status: 403 })
  }

  try {
    await syncExpiredSeminars()

    const isHighRole = auth.role === "OWNER" || auth.role === "ROOT"
    const roleCountsQuery = isHighRole ? prisma.user.groupBy({
      by: ["role"],
      _count: { _all: true }
    }) : Promise.resolve([])

    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000)
    const activeUsersQuery = isHighRole ? prisma.user.findMany({
      where: { lastSeen: { gte: fiveMinsAgo } },
      select: { id: true, name: true, surname: true, role: true, lastIp: true, lastSeen: true },
      orderBy: { lastSeen: "desc" }
    }) : Promise.resolve([])

    const [totalUsers, totalSeminars, activeSeminars, totalEntries, recentEntries, roleGroup, activeUsers] = await Promise.all([
      prisma.user.count(),
      prisma.seminar.count(),
      prisma.seminar.count({ where: { isActive: true } }),
      prisma.entry.count({ where: { type: "CHECKIN" } }),
      prisma.entry.findMany({
        take: isHighRole ? 30 : 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, surname: true, email: true, role: true } },
          seminar: { select: { name: true } },
        },
      }),
      roleCountsQuery,
      activeUsersQuery
    ])

    const roleCounts = { OWNER: 0, ADMIN: 0, STAFF: 0, MEMBER: 0 }
    if (isHighRole) {
      roleGroup.forEach(g => {
        const roleName = g.role as string;
        if (roleName === "ROOT") {
           if (auth.role !== "ROOT") {
             roleCounts.MEMBER += g._count._all;
           } else {
             (roleCounts as any).ROOT = g._count._all;
           }
        } else {
          (roleCounts as any)[roleName] = g._count._all;
        }
      })
    }

    const maskedActiveUsers = activeUsers.map(u => {
      if (u.role === "ROOT" && auth.role !== "ROOT") {
        return { ...u, role: "MEMBER" };
      }
      return u;
    });

    return NextResponse.json({
      stats: { totalUsers, totalSeminars, activeSeminars, totalEntries, roleCounts },
      recentEntries: recentEntries.map(e => ({
        ...e,
        user: {
          ...e.user,
          role: e.user.role === "ROOT" && auth.role !== "ROOT" ? "MEMBER" : e.user.role
        }
      })),
      activeUsers: maskedActiveUsers
    })
  } catch (error) {
    console.error("STATS API ERROR:", error)
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}
