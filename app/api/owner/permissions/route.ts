import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import fs from "fs"
import { prisma } from "@/lib/prisma"
import { logAction, LogSeverity } from "@/lib/logger"

const baseFeatures = [
  "can_view_users", "can_view_tc", "can_view_phone", "can_view_email", 
  "can_view_birthdate", "can_view_university", "can_edit_users", "can_delete_users",
  "can_edit_user_name", "can_edit_user_email", "can_edit_user_phone", "can_edit_user_tc", "can_edit_user_role",
  "can_edit_user_university", "can_edit_user_faculty", "can_edit_user_department", "can_edit_user_gender", "can_edit_user_birthdate",
  "can_reset_passwords", "can_verify_emails_manually", "can_change_user_roles",
  "can_view_seminars", "can_create_seminars", "can_edit_seminars", "can_delete_seminars", "can_toggle_seminar_active",
  "can_view_seminar_details", "can_export_seminar_participants",
  "can_view_staff", "can_add_staff", "can_remove_staff",
  "can_view_entries", "can_view_entry_details", "can_filter_entries", "can_view_own_entries", "can_manual_entry", "can_delete_entries",
  "can_scan_qr", "can_view_dashboard", "can_view_stats", "can_export_data",
  "can_view_active_users", "can_view_role_distribution", "can_view_system_logs", "can_manage_owner_permissions",
  "can_view_pending_approvals", "can_approve_requests", "can_clear_logs", "can_backup_database",
  "can_view_surname", "can_edit_permissions_of_admin", "can_edit_permissions_of_staff", "can_edit_permissions_of_member",
  "can_export_seminar_stats"
]

const defaultPermissions: Record<string, boolean> = {}

;["owner", "admin", "staff", "member"].forEach(role => {
  baseFeatures.forEach(feature => {
    defaultPermissions[`${role}.${feature}`] = false
  })
})

const defaultOverrides: Record<string, boolean> = {
  "admin.can_view_users": true,
  "admin.can_view_tc": true,
  "admin.can_view_phone": true,
  "admin.can_view_email": true,
  "admin.can_view_birthdate": true,
  "admin.can_view_university": true,
  "admin.can_edit_users": true,
  "admin.can_view_seminars": true,
  "admin.can_create_seminars": true,
  "admin.can_edit_seminars": true,
  "admin.can_toggle_seminar_active": true,
  "admin.can_view_staff": true,
  "admin.can_add_staff": true,
  "admin.can_view_entries": true,
  "admin.can_view_entry_details": true,
  "admin.can_filter_entries": true,
  "admin.can_scan_qr": true,
  "admin.can_view_dashboard": true,
  "admin.can_view_stats": true,
  "admin.can_view_seminar_details": true,
  "staff.can_scan_qr": true,
  "staff.can_view_own_entries": true,
  "member.can_view_own_entries": true
}

Object.assign(defaultPermissions, defaultOverrides)

const PERMS_FILE = process.cwd() + "/permissions.json"

function loadPermissions(): Record<string, boolean> {
  try {
    if (fs.existsSync(PERMS_FILE)) {
      const data = JSON.parse(fs.readFileSync(PERMS_FILE, "utf-8"))
      return { ...defaultPermissions, ...data }
    }
  } catch {}
  return { ...defaultPermissions }
}

function savePermissions(perms: Record<string, boolean>) {
  try {
    fs.writeFileSync(PERMS_FILE, JSON.stringify(perms, null, 2))
  } catch (e) {
    console.error("Permission save error:", e)
  }
}

async function verifyAuth(req: NextRequest) {
  const token = req.cookies.get("token")?.value
  if (!token) return { valid: false }
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(token, secret)
    return {
      valid: ["ROOT", "OWNER", "ADMIN", "STAFF"].includes(payload.role as string),
      role: payload.role as string,
      userId: payload.id as string
    }
  } catch {
    return { valid: false }
  }
}

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req)
  if (!auth.valid) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })
  }
  const perms = loadPermissions()
  return NextResponse.json({ permissions: perms, userRole: auth.role })
}

export async function PUT(req: NextRequest) {
  const auth = await verifyAuth(req)
  if (!auth.valid) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })
  }

  try {
    const { permissions: updates } = await req.json()
    if (!updates || typeof updates !== "object") {
      return NextResponse.json({ error: "Geçersiz veri." }, { status: 400 })
    }

    const currentPerms = loadPermissions()
    const requesterRoleStr = auth.role!.toLowerCase()

    if (auth.role === "ROOT") {
      const updated = { ...currentPerms, ...updates }
      savePermissions(updated)
      await logAction(auth.userId!, "Yetkiler Güncellendi (ROOT)", LogSeverity.CRITICAL, { changes: updates }, auth.role)
      return NextResponse.json({ success: true, permissions: updated })
    }

    const instantUpdates: Record<string, boolean> = {}
    const pendingUpdates: Record<string, boolean> = {}

    for (const key in updates) {
      const [targetRole, feature] = key.split('.')
      
      const canDirectlyEdit = currentPerms[`${requesterRoleStr}.can_edit_permissions_of_${targetRole}`]
      
      const hasThatPermission = currentPerms[`${requesterRoleStr}.${feature}`] === true

      if (canDirectlyEdit && hasThatPermission) {
        instantUpdates[key] = updates[key]
      } else {
        pendingUpdates[key] = updates[key]
      }
    }

    let responseMessage = ""

    if (Object.keys(instantUpdates).length > 0) {
      const updated = { ...currentPerms, ...instantUpdates }
      savePermissions(updated)
      await logAction(auth.userId!, "Yetkiler Doğrudan Güncellendi", LogSeverity.WARNING, { instantUpdates }, auth.role)
      responseMessage += "Bazı yetkiler hiyerarşik izninizle anında güncellendi. "
    }

    if (Object.keys(pendingUpdates).length > 0) {
      const oldValues: Record<string, boolean> = {}
      for (const key in pendingUpdates) {
        oldValues[key] = currentPerms[key] ?? false
      }

      await prisma.pendingAction.create({
        data: {
          type: "PERMISSION_UPDATE",
          data: {
            newValues: pendingUpdates,
            oldValues: oldValues
          },
          requesterId: auth.userId!,
          status: "PENDING"
        }
      })
      await logAction(auth.userId!, "Yetki Değişikliği Talebi Gönderildi", LogSeverity.INFO, { pendingUpdates, oldValues }, auth.role)
      responseMessage += "Bazı yetkiler için üst yönetim onayı gerekiyor."
    }

    return NextResponse.json({ 
      success: true, 
      message: responseMessage || "İşlem başarılı.",
      permissions: loadPermissions() 
    })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: "Sunucu hatası: " + error.message }, { status: 500 })
  }
}


