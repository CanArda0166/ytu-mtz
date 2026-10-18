import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jwtVerify } from "jose"
import { logAction, LogSeverity } from "@/lib/logger"

async function verifyRoot(req: NextRequest) {
  const token = req.cookies.get("token")?.value
  if (!token) return { valid: false }
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(token, secret)
    return {
      valid: payload.role === "ROOT",
      userId: payload.id as string,
      role: payload.role as string
    }
  } catch {
    return { valid: false }
  }
}

export async function POST(req: NextRequest) {
  const auth = await verifyRoot(req)
  if (!auth.valid) {
    return NextResponse.json({ error: "Sadece ROOT logları temizleyebilir." }, { status: 403 })
  }

  try {
    await prisma.systemLog.deleteMany({})

    await logAction(auth.userId!, "Sistem Logları Temizlendi", LogSeverity.CRITICAL, { timestamp: new Date() }, auth.role)

    return NextResponse.json({ success: true, message: "Tüm loglar başarıyla silindi." })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Loglar temizlenirken bir hata oluştu." }, { status: 500 })
  }
}
