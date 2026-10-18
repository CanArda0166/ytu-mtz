import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jwtVerify } from "jose"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { requestId, message } = body

    if (!requestId || !message) {
      return NextResponse.json({ error: "Talep ID ve mesaj zorunludur." }, { status: 400 })
    }

    const token = req.cookies.get("token")?.value
    if (!token) return NextResponse.json({ error: "Oturum açılmadı." }, { status: 401 })

    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    const userId = payload.id as string
    const userRole = payload.role as string

    // Find the request
    const helpRequest = await prisma.helpRequest.findUnique({
      where: { id: requestId }
    })

    if (!helpRequest) return NextResponse.json({ error: "Talep bulunamadı." }, { status: 404 })

    // AUTHORIZATION & ROLE LOGIC:
    // 1. If physical user is the OWNER of the ticket, they reply as "USER"
    // 2. If physical user is NOT the owner but is an ADMIN, they reply as "ADMIN"
    // 3. Otherwise, they are unauthorized.

    let senderRole: string = ""
    if (helpRequest.userId === userId) {
      senderRole = "USER"
    } else if (["ROOT", "OWNER", "ADMIN"].includes(userRole)) {
      senderRole = "ADMIN"
    } else {
       return NextResponse.json({ error: "Bu talebe yanıt verme yetkiniz yok." }, { status: 403 })
    }

    const newMessage = await prisma.helpMessage.create({
      data: {
        requestId,
        message,
        senderRole,
        senderId: userId
      }
    })

    // Update request timestamp
    await prisma.helpRequest.update({
      where: { id: requestId },
      data: { updatedAt: new Date() }
    })

    return NextResponse.json({ message: "Mesaj gönderildi.", data: newMessage })
  } catch (error) {
    console.error("Reply POST Error:", error)
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}
