import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Şifre en az 8 karakter olmalıdır." }, { status: 400 })
    }

    const tokenRecord = await prisma.token.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!tokenRecord || tokenRecord.type !== "PASSWORD_RESET") {
      return NextResponse.json({ error: "Geçersiz veya süresi dolmuş bağlantı." }, { status: 400 })
    }

    if (tokenRecord.expiresAt < new Date()) {
      await prisma.token.delete({ where: { token } })
      return NextResponse.json({ error: "Bağlantının süresi dolmuş. Lütfen tekrar talep edin." }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { password },
    })

    await prisma.token.delete({ where: { token } })

    return NextResponse.json({ message: "Şifre güncellendi." }, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}