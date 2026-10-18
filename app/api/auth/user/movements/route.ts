import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jwtVerify } from "jose"

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value
    if (!token) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 })

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(token, secret)
    const userId = payload.id as string

    const entries = await prisma.entry.findMany({
      where: { userId },
      include: { seminar: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ entries })
  } catch {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}