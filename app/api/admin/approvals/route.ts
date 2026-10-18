import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jwtVerify } from "jose"
import fs from "fs"

const PERMS_FILE = process.cwd() + "/permissions.json"

function loadPermissions(): Record<string, boolean> {
  try {
    if (fs.existsSync(PERMS_FILE)) {
      return JSON.parse(fs.readFileSync(PERMS_FILE, "utf-8"))
    }
  } catch {}
  return {}
}

function savePermissions(perms: Record<string, boolean>) {
  try {
    fs.writeFileSync(PERMS_FILE, JSON.stringify(perms, null, 2))
  } catch (e) {
    console.error("Permission save error:", e)
  }
}

async function verifyRoot(req: NextRequest) {
  const token = req.cookies.get("token")?.value
  if (!token) return false
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(token, secret)
    return payload.role === "ROOT"
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  if (!(await verifyRoot(req))) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })
  }

  try {
    const pending = await prisma.pendingAction.findMany({
      where: { status: "PENDING" },
      include: { requester: { select: { name: true, surname: true, email: true } } },
      orderBy: { createdAt: "desc" }
    })
    return NextResponse.json({ actions: pending })
  } catch (error) {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!(await verifyRoot(req))) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })
  }

  try {
    const { id, action } = await req.json() // action: "APPROVE" or "REJECT"

    const pending = await prisma.pendingAction.findUnique({ where: { id } })
    if (!pending) return NextResponse.json({ error: "İşlem bulunamadı." }, { status: 404 })

    if (action === "APPROVE") {
      if (pending.type === "PERMISSION_UPDATE") {
        const currentPerms = loadPermissions()
        const { newValues } = pending.data as any
        const updated = { ...currentPerms, ...newValues }
        savePermissions(updated)
      } else if (pending.type === "USER_EDIT") {
        const { id: userId, newValues } = pending.data as any
        await prisma.user.update({
          where: { id: userId },
          data: newValues
        })
      } else if (pending.type === "USER_DELETE") {
        const { id: userId } = pending.data as any
        await prisma.entry.deleteMany({ where: { userId } })
        await prisma.token.deleteMany({ where: { userId } })
        await prisma.user.delete({ where: { id: userId } })
      }
      
      await prisma.pendingAction.update({
        where: { id },
        data: { status: "APPROVED" }
      })
      
      return NextResponse.json({ message: "İşlem onaylandı ve uygulandı." })
    } else {
      await prisma.pendingAction.update({
        where: { id },
        data: { status: "REJECTED" }
      })
      return NextResponse.json({ message: "İşlem reddedildi." })
    }
  } catch (error) {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}
