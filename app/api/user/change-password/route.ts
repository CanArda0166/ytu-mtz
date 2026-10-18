import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jwtVerify } from "jose"
import { loadSystemConfig } from "@/lib/system-config"

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value
    if (!token) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 })

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(token, secret)
    const userId = payload.id as string

    const config = loadSystemConfig()
    if (!config.profileEditingEnabled && payload.role !== "ROOT") {
      return NextResponse.json({ error: "Sistem şu anda ROOT tarafından kilitlendi." }, { status: 403 })
    }

    const { currentPassword, newPassword } = await req.json()

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 })

    if (currentPassword !== user.password) {
      return NextResponse.json({ error: "Mevcut şifre hatalı." }, { status: 400 })
    }

    await prisma.user.update({ where: { id: userId }, data: { password: newPassword } })

    return NextResponse.json({ message: "Şifre güncellendi." })
  } catch {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}