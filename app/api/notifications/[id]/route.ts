import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jwtVerify } from "jose"

async function verifyAuth(req: NextRequest) {
  const token = req.cookies.get("token")?.value
  if (!token) return null
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(token, secret)
    if (!["ROOT", "OWNER", "ADMIN"].includes(payload.role as string)) return null
    return payload
  } catch {
    return null
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await verifyAuth(req)
  if (!auth) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 403 })

  const { id } = await params
  try {
    const notification = await (prisma as any).notification.findUnique({ where: { id } })
    if (!notification) return NextResponse.json({ error: "Duyuru bulunamadı." }, { status: 404 })

    if (auth.role === "ADMIN" && (notification.targetRole === "OWNER" || notification.targetRole === "ROOT")) {
      return NextResponse.json({ error: "Sizden üst bir role ait duyuruyu silemezsiniz." }, { status: 403 })
    }

    await (prisma as any).notification.delete({
      where: { id }
    })
    return NextResponse.json({ message: "Duyuru silindi." })
  } catch (error) {
    console.error("DELETE Notification Error:", error)
    return NextResponse.json({ error: "Duyuru silinemedi." }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await verifyAuth(req)
  if (!auth) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 403 })

  const { id } = await params
  try {
    const notification = await (prisma as any).notification.findUnique({ where: { id } })
    if (!notification) return NextResponse.json({ error: "Duyuru bulunamadı." }, { status: 404 })

    if (auth.role === "ADMIN" && (notification.targetRole === "OWNER" || notification.targetRole === "ROOT")) {
      return NextResponse.json({ error: "Sizden üst bir role ait duyuruyu düzenleyemezsiniz." }, { status: 403 })
    }

    const { isActive } = await req.json()
    await (prisma as any).notification.update({
      where: { id },
      data: { isActive }
    })
    return NextResponse.json({ message: "Duyuru güncellendi." })
  } catch (error) {
    console.error("PATCH Notification Error:", error)
    return NextResponse.json({ error: "Duyuru güncellenemedi." }, { status: 500 })
  }
}
