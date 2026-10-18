import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdminOrOwner } from "@/lib/auth"
import fs from "fs"
import { loadSystemConfig } from "@/lib/system-config"

function loadPermissions(): Record<string, boolean> {
  const PERMS_FILE = process.cwd() + "/permissions.json"
  try {
    if (fs.existsSync(PERMS_FILE)) {
      return JSON.parse(fs.readFileSync(PERMS_FILE, "utf-8"))
    }
  } catch {}
  return {}
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdminOrOwner(req)
  if (!auth.valid) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })

  const config = loadSystemConfig()
  if (!config.csvExportEnabled && auth.role !== "ROOT") {
    return NextResponse.json({ error: "Sistem şu anda ROOT tarafından kilitlendi." }, { status: 403 })
  }

  const perms = loadPermissions()
  const roleStr = auth.role!.toLowerCase()
  if (!perms[`${roleStr}.can_export_seminar_stats`] && auth.role !== "ROOT") {
    return NextResponse.json({ error: "Bu işlemi yapmak için yetkiniz yok." }, { status: 403 })
  }

  try {
    const { id } = await params
    const seminar = await prisma.seminar.findUnique({
      where: { id },
      include: {
        entries: {
          orderBy: { createdAt: "asc" },
          include: {
            user: true
          }
        }
      }
    })

    if (!seminar) return NextResponse.json({ error: "Seminer bulunamadı." }, { status: 404 })

    const userStats = new Map<string, any>()

    seminar.entries.forEach(entry => {
      if (!userStats.has(entry.userId)) {
        userStats.set(entry.userId, {
          user: entry.user,
          checkins: [],
          checkouts: [],
          totalDurationMs: 0
        })
      }
      const data = userStats.get(entry.userId)
      if (entry.type === "CHECKIN") data.checkins.push(entry.createdAt)
      else data.checkouts.push(entry.createdAt)
    })

    const DEFAULT_STAY_MS = 1.5 * 60 * 60 * 1000 // 1.5 Saat (90 dakika)

    userStats.forEach(stat => {
      stat.checkins.forEach((inTime: Date) => {
        const outTime = stat.checkouts.find((o: Date) => o > inTime)
        if (outTime) {
          stat.totalDurationMs += (outTime.getTime() - inTime.getTime())
        } else {
          stat.totalDurationMs += DEFAULT_STAY_MS
        }
      })
    })

    const csvRows = []
    
    csvRows.push([
      "İsim", "Soyisim", "E-Mail", "Telefon", "TC No", "Cinsiyet", 
      "Üniversite", "Fakülte", "Bölüm", "Doğum Tarihi", 
      "Kayıt Zamanı", "Toplam Süre (Dakika)", "Durum"
    ].join(","))

    userStats.forEach(stat => {
      const u = stat.user
      const durationMin = Math.round(stat.totalDurationMs / 60000)
      const hasIncomplete = stat.checkins.length > stat.checkouts.length
      
      const row = [
        u.name,
        u.surname,
        u.email,
        u.phone,
        `'${u.tcNo}`, // TC no'nun Excel'de bozulmaması için
        u.gender || "-",
        u.university || "-",
        u.faculty || "-",
        u.department || "-",
        u.birthDate.toISOString().split('T')[0],
        u.createdAt.toISOString(),
        durationMin,
        hasIncomplete ? "Çıkış Yapılmadı" : "Tamamlandı"
      ].map(v => `"${String(v).replace(/"/g, '""')}"`)
      
      csvRows.push(row.join(","))
    })

    const csvData = "\ufeff" + csvRows.join("\n")

    return new NextResponse(csvData, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="seminar_${id}_export.csv"`
      }
    })

  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}
