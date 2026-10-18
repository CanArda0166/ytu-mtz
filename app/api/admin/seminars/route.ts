import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdminOrOwner } from "@/lib/auth"
import { logAction, LogSeverity } from "@/lib/logger"
import { loadSystemConfig } from "@/lib/system-config"
import { syncExpiredSeminars } from "@/lib/seminar-sync"

export async function GET(req: NextRequest) {
  const auth = await verifyAdminOrOwner(req)
  if (!auth.valid) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })
  }

  try {
    await syncExpiredSeminars()
    
    const seminars = await prisma.seminar.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { entries: true } },
      },
    })
    return NextResponse.json({ seminars })
  } catch {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdminOrOwner(req)
  if (!auth.valid) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })
  }

  const config = loadSystemConfig()
  if (!config.seminarOperationsEnabled && auth.role !== "ROOT") {
    return NextResponse.json({ error: "Sistem şu anda ROOT tarafından kilitlendi." }, { status: 403 })
  }

  try {
    const { name, description, capacity, startTime, endTime, isActive } = await req.json()

    if (!name) {
      return NextResponse.json({ error: "Seminer adı zorunludur." }, { status: 400 })
    }

    const seminar = await prisma.seminar.create({
      data: {
        name,
        description: description || null,
        capacity: capacity ? parseInt(capacity) : null,
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    await logAction(auth.userId!, "Yeni Seminer Oluşturuldu", LogSeverity.INFO, { seminarId: seminar.id, name: seminar.name }, auth.role)

    return NextResponse.json({ seminar }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const auth = await verifyAdminOrOwner(req)
  if (!auth.valid) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })
  }

  const config = loadSystemConfig()
  if (!config.seminarOperationsEnabled && auth.role !== "ROOT") {
    return NextResponse.json({ error: "Sistem şu anda ROOT tarafından kilitlendi." }, { status: 403 })
  }

  try {
    const { id, name, description, capacity, startTime, endTime, isActive } = await req.json()

    if (!id || !name) {
      return NextResponse.json({ error: "ID ve ad zorunludur." }, { status: 400 })
    }

    const seminar = await prisma.seminar.update({
      where: { id },
      data: {
        name,
        description: description || null,
        capacity: capacity ? parseInt(capacity) : null,
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    await logAction(auth.userId!, "Seminer Güncellendi", LogSeverity.INFO, { seminarId: id, updates: seminar }, auth.role)

    return NextResponse.json({ seminar })
  } catch {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await verifyAdminOrOwner(req)
  if (!auth.valid) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })
  }

  const config = loadSystemConfig()
  if (!config.seminarOperationsEnabled && auth.role !== "ROOT") {
    return NextResponse.json({ error: "Sistem şu anda ROOT tarafından kilitlendi." }, { status: 403 })
  }

  try {
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: "ID zorunludur." }, { status: 400 })
    }

    await prisma.entry.deleteMany({ where: { seminarId: id } })
    await prisma.seminar.delete({ where: { id } })

    await logAction(auth.userId!, "Seminer Silindi", LogSeverity.CRITICAL, { seminarId: id }, auth.role)

    return NextResponse.json({ message: "Seminer silindi." })
  } catch {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}
