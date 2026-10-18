import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jwtVerify } from "jose"
import { syncExpiredSeminars } from "@/lib/seminar-sync"

async function verifyOwner(req: NextRequest) {
  const token = req.cookies.get("token")?.value
  if (!token) return null
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(token, secret)
    if (payload.role !== "OWNER" && payload.role !== "ROOT") return null
    return payload
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const owner = await verifyOwner(req)
  if (!owner) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })

  try {
    await syncExpiredSeminars()

    const [
      totalUsers, totalSeminars, activeSeminars, totalEntries,
      users, seminars, entries
    ] = await Promise.all([
      prisma.user.count(),
      prisma.seminar.count(),
      prisma.seminar.count({ where: { isActive: true } }),
      prisma.entry.count({ where: { type: "CHECKIN" } }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true, name: true, surname: true, email: true,
          phone: true, tcNo: true, role: true, university: true,
          emailVerified: true, createdAt: true,
        }
      }),
      prisma.seminar.findMany({
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, isActive: true, _count: { select: { entries: { where: { type: "CHECKIN" } } } } }
      }),
      prisma.entry.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
        select: {
          id: true, type: true, scannedByName: true, createdAt: true,
          user: { select: { name: true, surname: true, email: true } },
          seminar: { select: { name: true } },
        }
      }),
    ])

    const maskedUsers = users.map(u => ({
      ...u,
      role: (u.role === "ROOT" && owner.role !== "ROOT") ? "MEMBER" : u.role
    }))

    const roleCounts: any = {
      OWNER: maskedUsers.filter(u => u.role === "OWNER").length,
      ADMIN: maskedUsers.filter(u => u.role === "ADMIN").length,
      STAFF: maskedUsers.filter(u => u.role === "STAFF").length,
      MEMBER: maskedUsers.filter(u => u.role === "MEMBER").length,
    }

    if (owner.role === "ROOT") {
      roleCounts.ROOT = maskedUsers.filter(u => u.role === "ROOT").length
    }

    return NextResponse.json({
      stats: { totalUsers, totalSeminars, activeSeminars, totalEntries, roleCounts },
      users: maskedUsers,
      seminars,
      entries,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}
