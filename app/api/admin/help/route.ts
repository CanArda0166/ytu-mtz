import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdminOrOwner } from "@/lib/auth"
import { loadPermissions } from "@/lib/permission"
import { logAction } from "@/lib/logger"
import { checkApprovalRequired, createPendingAction } from "@/lib/approval"

export async function GET(req: NextRequest) {
  const auth = await verifyAdminOrOwner(req)
  if (!auth.valid) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })

  const perms = await loadPermissions()
  const roleKey = auth.role!.toLowerCase()
  if (auth.role !== "ROOT" && !perms[`${roleKey}.can_view_help_requests`]) {
    return NextResponse.json({ error: "Yardım taleplerini görüntüleme yetkiniz yok." }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "10")
  const skip = (page - 1) * limit
  const status = searchParams.get("status")

  try {
    const where = status ? { status } : {}
    const [requests, total] = await Promise.all([
      prisma.helpRequest.findMany({
        where,
        include: {
          user: {
            select: { name: true, surname: true, email: true, role: true }
          },
          messages: {
            include: {
              sender: {
                select: { name: true, surname: true, role: true }
              }
            },
            orderBy: { createdAt: "asc" }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.helpRequest.count({ where })
    ])

    return NextResponse.json({ 
      requests,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Admin Help GET Error:", error)
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}

// Add admin message (Reply)
export async function PATCH(req: NextRequest) {
  const auth = await verifyAdminOrOwner(req)
  if (!auth.valid) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })

  const perms = await loadPermissions()
  const roleKey = auth.role!.toLowerCase()
  if (auth.role !== "ROOT" && !perms[`${roleKey}.can_respond_help_requests`]) {
    return NextResponse.json({ error: "Yardım taleplerini yanıtlama yetkiniz yok." }, { status: 403 })
  }

  try {
    const { id, message, status } = await req.json()
    if (!id || !message) return NextResponse.json({ error: "ID ve mesaj zorunludur." }, { status: 400 })

    // Approval Check
    const needsApproval = await checkApprovalRequired(auth.role!, "can_respond_help_requests")
    if (needsApproval) {
      await createPendingAction("HELP_REPLY", { requestId: id, message, status }, auth.userId!)
      await logAction(auth.userId!, "HELP_REPLY_PENDING", `Talep #${id} için onay beklenecek.`)
      return NextResponse.json({ message: "İşlem onay bekliyor. Üst yönetim onayladığında mesaj gönderilecektir.", pending: true })
    }

    const [updatedMessage, updatedRequest] = await prisma.$transaction([
      prisma.helpMessage.create({
        data: {
          requestId: id,
          message,
          senderRole: "ADMIN",
          senderId: auth.userId
        }
      }),
      prisma.helpRequest.update({
        where: { id },
        data: {
          status: status || "OPEN",
          updatedAt: new Date()
        }
      })
    ])

    await logAction(auth.userId!, "HELP_REPLY", `Talep #${id} yanıtlandı.`)

    return NextResponse.json({ message: "Yanıt eklendi.", request: updatedRequest })
  } catch (error) {
    console.error("Admin Help PATCH Error:", error)
    return NextResponse.json({ error: "Güncelleme sırasında hata oluştu." }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await verifyAdminOrOwner(req)
  if (!auth.valid) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })

  const perms = await loadPermissions()
  const roleKey = auth.role!.toLowerCase()
  if (auth.role !== "ROOT" && !perms[`${roleKey}.can_delete_help_requests`]) {
    return NextResponse.json({ error: "Yardım taleplerini silme yetkiniz yok." }, { status: 403 })
  }

  try {
    const { id } = await req.json()

    // Approval Check (Optional for delete, but good to have)
    const needsApproval = await checkApprovalRequired(auth.role!, "can_delete_help_requests")
    if (needsApproval) {
       await createPendingAction("HELP_DELETE", { requestId: id }, auth.userId!)
       await logAction(auth.userId!, "HELP_DELETE_PENDING", `Talep #${id} silme onayı beklenecek.`)
       return NextResponse.json({ message: "Silme işlemi onay bekliyor.", pending: true })
    }

    await prisma.helpRequest.delete({ where: { id } })
    await logAction(auth.userId!, "HELP_DELETE", `Talep #${id} silindi.`)

    return NextResponse.json({ message: "Talep ve tüm mesajları silindi." })
  } catch (error) {
    return NextResponse.json({ error: "Silme sırasında hata oluştu." }, { status: 500 })
  }
}
