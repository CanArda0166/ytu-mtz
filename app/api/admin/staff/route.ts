import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdminOrOwner } from "@/lib/auth"
import { logAction, LogSeverity } from "@/lib/logger"

const RolePriority: Record<string, number> = {
  ROOT: 4,
  OWNER: 3,
  ADMIN: 2,
  STAFF: 1,
  MEMBER: 0
}

export async function GET(req: NextRequest) {
  const auth = await verifyAdminOrOwner(req)
  if (!auth.valid) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })

  try {
    const staff = await prisma.user.findMany({
      where: { role: "STAFF" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, surname: true, email: true,
        phone: true, tcNo: true, createdAt: true,
      },
    })
    return NextResponse.json({ staff })
  } catch {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdminOrOwner(req)
  if (!auth.valid) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })

  try {
    const { name, surname, email, phone, tcNo, password, existingEmail } = await req.json()

    if (existingEmail) {
      const existing = await prisma.user.findUnique({ where: { email: existingEmail } })
      if (!existing) return NextResponse.json({ error: "Sistemde böyle bir kullanıcı bulunamadı." }, { status: 404 })
      
      const authRole = auth.role as string
      const targetRole = existing.role as string

      if (targetRole === "ROOT" && authRole !== "ROOT") {
        return NextResponse.json({ error: "ROOT kullanıcısı üzerinde değişiklik yapma yetkiniz yok." }, { status: 403 })
      }

      if (authRole !== "ROOT" && (RolePriority[authRole] || 0) <= (RolePriority[targetRole] || 0)) {
        return NextResponse.json({ error: "Kendinizle aynı veya daha üst roldeki bir hesabı düzenleme yetkiniz yok." }, { status: 403 })
      }

      if (existing.role === "STAFF" || existing.role === "ADMIN" || existing.role === "OWNER") {
        return NextResponse.json({ error: "Bu kullanıcı zaten yetkili bir rolde." }, { status: 400 })
      }

      const updated = await prisma.user.update({
        where: { email: existingEmail },
        data: { role: "STAFF" }
      })

      await logAction(auth.userId!, "Kullanıcı Staff Yapıldı (Yükseltme)", LogSeverity.INFO, { targetEmail: existingEmail }, auth.role)

      return NextResponse.json({ staff: updated }, { status: 200 })
    }

    if (!name || !surname || !email || !phone || !tcNo || !password) {
      return NextResponse.json({ error: "Tüm alanlar zorunludur." }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      if (existing.role === "MEMBER") {
        const updated = await prisma.user.update({
          where: { email },
          data: { role: "STAFF" }
        })
        return NextResponse.json({ staff: updated }, { status: 200 })
      }
      return NextResponse.json({ error: "Bu e-posta zaten kayıtlı." }, { status: 400 })
    }

    const staff = await prisma.user.create({
      data: {
        name, surname, email, phone,
        birthDate: new Date(),
        tcNo, password,
        role: "STAFF",
        emailVerified: true,
      },
    })

    await logAction(auth.userId!, "Yeni Staff Oluşturuldu", LogSeverity.INFO, { staffId: staff.id, email: staff.email }, auth.role)

    return NextResponse.json({ staff }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await verifyAdminOrOwner(req)
  if (!auth.valid) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })

  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: "ID zorunludur." }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 })

    const authRole = auth.role as string
    const targetRole = user.role as string

    if (targetRole === "ROOT" && authRole !== "ROOT") {
      return NextResponse.json({ error: "ROOT kullanıcısı üzerinde değişiklik yapma yetkiniz yok." }, { status: 403 })
    }

    if (authRole !== "ROOT" && (RolePriority[authRole] || 0) <= (RolePriority[targetRole] || 0)) {
      return NextResponse.json({ error: "Kendinizle aynı veya daha üst roldeki bir hesabı düzenleme yetkiniz yok." }, { status: 403 })
    }

    await prisma.user.update({
      where: { id },
      data: { role: "MEMBER" }
    })

    await logAction(auth.userId!, "Staff Yetkisi Kaldırıldı", LogSeverity.WARNING, { targetUserId: id }, auth.role)

    return NextResponse.json({ message: "Görevli yetkisi kaldırıldı." })
  } catch {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}
