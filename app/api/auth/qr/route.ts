import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jwtVerify } from "jose"
import crypto from "crypto"

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value
    if (!token) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 })

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(token, secret)
    const userId = payload.id as string

    await prisma.token.deleteMany({
      where: { userId, type: "QR" }
    })

    const qrToken = crypto.randomBytes(32).toString("hex")
    await prisma.token.create({
      data: {
        userId,
        token: qrToken,
        type: "QR",
        expiresAt: new Date(Date.now() + 60 * 1000),
      }
    })

    return NextResponse.json({ token: qrToken })
  } catch {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}