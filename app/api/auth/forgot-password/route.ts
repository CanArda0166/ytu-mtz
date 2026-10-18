import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { sendPasswordResetEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "E-posta zorunludur." }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json({ message: "Gönderildi." }, { status: 200 })
    }

    await prisma.token.deleteMany({
      where: { userId: user.id, type: "PASSWORD_RESET" },
    })

    const token = crypto.randomBytes(32).toString("hex")

    await prisma.token.create({
      data: {
        userId: user.id,
        token,
        type: "PASSWORD_RESET",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    })

    await sendPasswordResetEmail(email, token, user.name)

    return NextResponse.json({ message: "Gönderildi." }, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}