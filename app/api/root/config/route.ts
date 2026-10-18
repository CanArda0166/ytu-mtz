import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { loadSystemConfig, saveSystemConfig } from "@/lib/system-config"
import { logAction, LogSeverity } from "@/lib/logger"
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

async function verifyAccess(req: NextRequest, requiredPermission?: string) {
  const token = req.cookies.get("token")?.value
  if (!token) return { valid: false }
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(token, secret)
    
    if (payload.role === "ROOT") return { valid: true, userId: payload.id as string, role: "ROOT" }
    
    if (requiredPermission) {
      const perms = loadPermissions()
      const hasPerm = perms[`${(payload.role as string).toLowerCase()}.${requiredPermission}`] === true
      if (hasPerm) return { valid: true, userId: payload.id as string, role: payload.role as string }
    }

    return { valid: false }
  } catch {
    return { valid: false }
  }
}

export async function GET(req: NextRequest) {
  const auth = await verifyAccess(req, "can_view_system_config")
  if (!auth.valid) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })

  const config = loadSystemConfig()
  return NextResponse.json({ config })
}

export async function POST(req: NextRequest) {
  const auth = await verifyAccess(req, "can_manage_system_config")
  if (!auth.valid) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })

  try {
    const updates = await req.json()
    const updated = saveSystemConfig(updates)
    
    await logAction(
      auth.userId!, 
      "Sistem Ayarları Güncellendi", 
      LogSeverity.WARNING, 
      { updates: updated }, 
      auth.role!
    )

    return NextResponse.json({ message: "Sistem ayarları güncellendi.", config: updated })
  } catch (error) {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}
