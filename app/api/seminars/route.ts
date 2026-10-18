import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jwtVerify } from "jose"
import { syncExpiredSeminars } from "@/lib/seminar-sync"

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value
    if (!token) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 })

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    await jwtVerify(token, secret)

    await syncExpiredSeminars()

    const seminars = await prisma.seminar.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json({ seminars })
  } catch {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}