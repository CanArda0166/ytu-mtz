import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdminOrOwner } from "@/lib/auth"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await verifyAdminOrOwner(req)
  if (!auth.valid) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })

  try {
    const uniqueUserChecks = new Set<string>()
    const hourlyData: Record<number, number> = {}
    
    for (let i = 0; i < 24; i++) hourlyData[i] = 0

    const entries = await prisma.entry.findMany({
      where: { seminarId: id, type: "CHECKIN" },
      select: { userId: true, createdAt: true },
      orderBy: { createdAt: "asc" }
    })

    entries.forEach(entry => {
      if (!uniqueUserChecks.has(entry.userId)) {
        uniqueUserChecks.add(entry.userId)
        const hour = new Date(entry.createdAt).getHours()
        hourlyData[hour] = (hourlyData[hour] || 0) + 1
      }
    })

    const result = Object.entries(hourlyData).map(([hour, count]) => ({
      hour: parseInt(hour),
      count
    }))

    return NextResponse.json({ stats: result })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "İstatistikler yüklenemedi." }, { status: 500 })
  }
}
