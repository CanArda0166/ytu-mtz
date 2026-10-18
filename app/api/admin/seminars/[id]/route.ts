import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdminOrOwner } from "@/lib/auth"
import fs from "fs"
import { logAction, LogSeverity } from "@/lib/logger"

function loadPermissions(): Record<string, boolean> {
  const PERMS_FILE = process.cwd() + "/permissions.json"
  try {
    if (fs.existsSync(PERMS_FILE)) {
      return JSON.parse(fs.readFileSync(PERMS_FILE, "utf-8"))
    }
  } catch {}
  return {}
}

function maskEmail(email: string) {
  if (!email) return email;
  const parts = email.split("@");
  if (parts.length !== 2) return email;
  const username = parts[0];
  const domain = parts[1];
  let maskedUsername = username;
  if (username.length > 6) {
    maskedUsername = username.substring(0, 3) + "***" + username.substring(username.length - 3);
  } else {
    maskedUsername = username[0] + "***" + (username[username.length-1] || "");
  }
  return maskedUsername + "@" + domain;
}

function maskPhone(phone: string) {
  if (!phone || phone.length < 3) return phone;
  return "*".repeat(phone.length - 3) + phone.slice(-3);
}

function maskName(str: string) {
  if (!str) return str;
  return str.charAt(0) + "***";
}

function maskTc(tc: string) {
  if (!tc || tc.length < 2) return tc;
  return tc[0] + "*".repeat(tc.length - 2) + tc[tc.length - 1];
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdminOrOwner(req)
  if (!auth.valid) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })

  try {
    const { id } = await params

    const seminar = await prisma.seminar.findUnique({
      where: { id },
      include: {
        entries: {
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
                email: true,
                tcNo: true,
                university: true,
                faculty: true,
                department: true,
              }
            }
          }
        }
      }
    })

    if (!seminar) {
      return NextResponse.json({ error: "Seminer bulunamadı." }, { status: 404 })
    }

    const checkinUserIds = new Set(seminar.entries.filter(e => e.type === "CHECKIN").map(e => e.userId))
    const uniqueCount = checkinUserIds.size

    const perms = loadPermissions()
    
    const uniqueParticipantsMap = new Map<string, any>()
    seminar.entries.forEach((entry: any) => {
      if (!uniqueParticipantsMap.has(entry.userId)) {
        uniqueParticipantsMap.set(entry.userId, entry)
      }
    })

    const maskedEntries = Array.from(uniqueParticipantsMap.values()).map((entry: any) => {
      const u = entry.user
      const isSelf = auth.userId === u.id
      const bypassMasking = (auth.role === "ROOT" || isSelf)

      const roleStr = auth.role!.toLowerCase()
      const canViewTc = perms[`${roleStr}.can_view_tc`]
      const canViewEmail = perms[`${roleStr}.can_view_email`]
      const canViewPhone = perms[`${roleStr}.can_view_phone`]
      const canViewSurname = perms[`${roleStr}.can_view_surname`]
      
      return {
        ...entry,
        user: {
          ...u,
          surname: (bypassMasking || canViewSurname) ? u.surname : maskName(u.surname),
          tcNo: (bypassMasking || canViewTc) ? u.tcNo : maskTc(u.tcNo),
          phone: (bypassMasking || canViewPhone) ? u.phone : maskPhone(u.phone || ""),
          email: (bypassMasking || canViewEmail) ? u.email : maskEmail(u.email),
        }
      }
    })

    await logAction(auth.userId!, "Seminer Detayları Görüntülendi", LogSeverity.INFO, { seminarId: id, name: seminar.name }, auth.role)

    return NextResponse.json({
      seminar: {
        ...seminar,
        _count: { entries: uniqueCount },
        totalEntries: seminar.entries.length,
        entries: maskedEntries
      }
    })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: "Sunucu hatası: " + error.message }, { status: 500 })
  }
}
