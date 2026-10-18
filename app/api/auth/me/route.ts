import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jwtVerify } from "jose"

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value

    if (!token) {
      return NextResponse.json({ error: "Yetkisiz." }, { status: 401 })
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(token, secret)

    const user = await prisma.user.findUnique({
      where: { id: payload.id as string },
      select: { id: true, name: true, surname: true, email: true, role: true }
    })

    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 })
    }

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "Unknown"

    prisma.user.update({
      where: { id: user.id },
      data: { lastSeen: new Date(), lastIp: ip }
    }).catch(console.error)

    return NextResponse.json({ user })
  } catch {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 })
  }
}