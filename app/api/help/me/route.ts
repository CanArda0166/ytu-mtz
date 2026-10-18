import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jwtVerify } from "jose"

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value
    if (!token) return NextResponse.json({ error: "Oturum açılmadı." }, { status: 401 })

    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    const userId = payload.id as string

    if (!userId) return NextResponse.json({ error: "Geçersiz kullanıcı." }, { status: 401 })

    const requests = await prisma.helpRequest.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error("My Help Requests Error:", error)
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}
