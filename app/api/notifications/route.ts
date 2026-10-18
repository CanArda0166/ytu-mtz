import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jwtVerify } from "jose"

import { loadSystemConfig } from "@/lib/system-config"

async function getAuth(req: NextRequest) {
  const token = req.cookies.get("token")?.value
  if (!token) return null
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const auth = await getAuth(req)
  if (!auth) return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 })

  const config = loadSystemConfig()
  const isRoot = auth.role === "ROOT"

  if (!config.notificationsEnabled && !isRoot) {
    return NextResponse.json({ notifications: [] })
  }

  try {
    const notifications = await (prisma as any).notification.findMany({
      where: {
        isActive: true,
        AND: [
          {
            OR: [
              { targetRole: null },
              { targetRole: auth.role as string },
            ]
          },
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } }
            ]
          }
        ]
      },
      orderBy: { createdAt: "desc" },
      take: 5
    })

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error("GET Notifications Error:", error)
    return NextResponse.json({ error: "Bildirimler alınamadı." }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await getAuth(req)
  if (!auth || !["ROOT", "OWNER", "ADMIN"].includes(auth.role as string)) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 403 })
  }

  const config = loadSystemConfig()
  const isRoot = auth.role === "ROOT"

  if (!config.notificationsEnabled && !isRoot) {
    return NextResponse.json({ error: "Sistem duyuruları şu an kapalıdır." }, { status: 403 })
  }

  try {
    const { message, type, targetRole, expiresAt } = await req.json()

    if (!message) {
      return NextResponse.json({ error: "Mesaj boş olamaz." }, { status: 400 })
    }

    const notification = await (prisma as any).notification.create({
      data: {
        message,
        type: type || "INFO",
        targetRole: targetRole === "ALL" ? null : targetRole,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      }
    })

    return NextResponse.json({ message: "Duyuru gönderildi.", notification })
  } catch (error) {
    console.error("POST Notification Error:", error)
    return NextResponse.json({ error: "Duyuru gönderilemedi." }, { status: 500 })
  }
}
