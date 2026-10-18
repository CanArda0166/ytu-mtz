import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jwtVerify } from "jose"
import { loadSystemConfig } from "@/lib/system-config"
import { syncExpiredSeminars } from "@/lib/seminar-sync"

export async function POST(req: NextRequest) {
  try {
    await syncExpiredSeminars()
    const token = req.cookies.get("token")?.value
    if (!token) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 })

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(token, secret)

    if (payload.role !== "OWNER" && payload.role !== "STAFF" && payload.role !== "ADMIN" && payload.role !== "ROOT") {
      return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })
    }

    const config = loadSystemConfig()
    if (!config.qrScanningEnabled && payload.role !== "ROOT") {
      return NextResponse.json({ error: "Sistem şu anda ROOT tarafından kilitlendi." }, { status: 403 })
    }

    let scannerName = "Bilinmiyor"
    if (payload.id) {
      const scanner = await prisma.user.findUnique({
        where: { id: payload.id as string },
        select: { name: true, surname: true }
      })
      if (scanner) scannerName = `${scanner.name} ${scanner.surname}`
    }

    const { qrToken, seminarId, type } = await req.json()

    if (!qrToken || !seminarId || !type) {
      return NextResponse.json({ error: "Eksik bilgi." }, { status: 400 })
    }

    const tokenRecord = await prisma.token.findUnique({
      where: { token: qrToken },
      include: { user: true },
    })

    if (!tokenRecord || tokenRecord.type !== "QR") {
      return NextResponse.json({ error: "Geçersiz QR kod." }, { status: 400 })
    }

    if (tokenRecord.expiresAt < new Date()) {
      return NextResponse.json({ error: "QR kodun süresi dolmuş." }, { status: 400 })
    }

    const seminar = await prisma.seminar.findUnique({ where: { id: seminarId } })
    if (!seminar) {
      return NextResponse.json({ error: "Seminer bulunamadı." }, { status: 404 })
    }

    if (type === "CHECKIN" && !seminar.isActive) {
      return NextResponse.json({ error: "Bu seminer şu anda aktif değil veya süresi dolmuş." }, { status: 400 })
    }

    const user = tokenRecord.user

    const lastEntry = await prisma.entry.findFirst({
      where: { userId: user.id, seminarId },
      orderBy: { createdAt: "desc" },
    })

    const currentStatus = lastEntry?.type ?? null

    if (type === "CHECKIN" && currentStatus === "CHECKIN") {
      return NextResponse.json({
        error: `${user.name} ${user.surname} zaten içeride!`,
        status: "already_inside",
      }, { status: 400 })
    }

    if (type === "CHECKOUT" && (currentStatus === "CHECKOUT" || currentStatus === null)) {
      return NextResponse.json({
        error: `${user.name} ${user.surname} zaten dışarıda!`,
        status: "already_outside",
      }, { status: 400 })
    }

    if (type === "CHECKIN" && seminar.capacity !== null) {
      const allUserIds = await prisma.entry.findMany({
        where: { seminarId },
        select: { userId: true, type: true },
        orderBy: { createdAt: "desc" },
      })

      const userStatuses: Record<string, string> = {}
      for (const e of allUserIds) {
        if (!userStatuses[e.userId]) userStatuses[e.userId] = e.type
      }
      const insideNow = Object.values(userStatuses).filter((s) => s === "CHECKIN").length

      if (insideNow >= seminar.capacity) {
        return NextResponse.json({
          error: `Kontenjan dolu! (${insideNow}/${seminar.capacity})`,
          status: "capacity_full",
        }, { status: 400 })
      }
    }

    await prisma.entry.create({
      data: {
        userId: user.id,
        seminarId,
        type: type as "CHECKIN" | "CHECKOUT",
        scannedByName: scannerName,
      },
    })

    let durationText: string | undefined = undefined;
    if (type === "CHECKOUT" && lastEntry && lastEntry.type === "CHECKIN") {
      const now = new Date();
      const diffMs = now.getTime() - lastEntry.createdAt.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;

      const checkinTime = lastEntry.createdAt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      const checkoutTime = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

      if (hours > 0) {
        durationText = `Giriş: ${checkinTime} | Çıkış: ${checkoutTime} (Süre: ${hours} saat ${mins} dakika)`;
      } else {
        durationText = `Giriş: ${checkinTime} | Çıkış: ${checkoutTime} (Süre: ${mins} dakika)`;
      }
    }

    return NextResponse.json({
      message: `${user.name} ${user.surname} ${type === "CHECKIN" ? "girişi" : "çıkışı"} başarıyla kaydedildi.`,
      user: { name: user.name, surname: user.surname, email: user.email },
      type,
      durationText,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}