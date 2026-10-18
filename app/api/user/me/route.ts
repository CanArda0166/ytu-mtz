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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, surname: true, email: true,
        phone: true, birthDate: true, university: true,
        faculty: true, department: true, role: true,
      }
    })

    if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 })

    return NextResponse.json({ user })
  } catch {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}