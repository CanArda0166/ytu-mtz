import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jwtVerify } from "jose"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, subject, message, priority } = body

    if (!subject || !message) {
      return NextResponse.json({ error: "Konu ve mesaj alanları zorunludur." }, { status: 400 })
    }

    // Try to get userId from token if it exists
    let userId: string | undefined = undefined
    const token = req.cookies.get("token")?.value
    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET)
        const { payload } = await jwtVerify(token, secret)
        userId = payload.id as string
      } catch (e) {
        // Token is invalid or expired, proceed as guest
      }
    }

    // Use relationship-based connect for userId to be safe
    const helpRequest = await prisma.helpRequest.create({
      data: {
        user: userId ? { connect: { id: userId } } : undefined,
        name: userId ? undefined : (name || "Misafir"),
        email: userId ? undefined : email,
        subject,
        message: "", // Keeping for schema compatibility 
        priority: priority || "NORMAL",
        status: "OPEN",
        messages: {
          create: {
            message,
            senderRole: "USER",
            senderId: userId || null
          }
        }
      }
    })

    return NextResponse.json({ 
      message: "Yardım talebiniz başarıyla alındı. En kısa sürede ilgileneceğiz.",
      id: helpRequest.id 
    })
  } catch (error) {
    console.error("Help Request Error:", error)
    return NextResponse.json({ error: "Bir hata oluştu. Lütfen daha sonra tekrar deneyin." }, { status: 500 })
  }
}
