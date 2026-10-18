import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jwtVerify } from "jose"
import fs from "fs"

function loadPermissions(): Record<string, boolean> {
  const PERMS_FILE = process.cwd() + "/permissions.json"
  try {
    if (fs.existsSync(PERMS_FILE)) {
      return JSON.parse(fs.readFileSync(PERMS_FILE, "utf-8"))
    }
  } catch {}
  return {}
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value
    if (!token) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 })

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(token, secret)
    const userRole = payload.role as string;
    const isHighRole = userRole === "OWNER" || userRole === "ROOT"

    if (!isHighRole) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, surname: true, email: true, role: true }
    })

    const maskedUsers = users.map(u => {
      let currentRole = u.role as string;
      if (currentRole === "ROOT" && userRole !== "ROOT") {
        currentRole = "MEMBER";
      }
      return { ...u, role: currentRole };
    })

    return NextResponse.json({ users: maskedUsers })
  } catch (error) {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value
    if (!token) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 })

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(token, secret)
    const authRole = payload.role as string;
    const authId = payload.id as string;
    const isHighRole = authRole === "OWNER" || authRole === "ROOT"
    if (!isHighRole) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 })
    }

    const { userId, role } = await req.json()
    if (!userId || !role) {
      return NextResponse.json({ error: "Eksik bilgi." }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 })

    const targetRole = targetUser.role as string;
    
    const perms = loadPermissions()
    if (authRole !== "ROOT" && !perms[`${authRole.toLowerCase()}.can_change_user_roles`]) {
      return NextResponse.json({ error: "Kullanıcı rolü değiştirme yetkiniz yok." }, { status: 403 })
    }


    if (targetRole === "ROOT" && authRole !== "ROOT") {
      return NextResponse.json({ error: "ROOT kullanıcısı üzerinde değişiklik yapma yetkiniz yok." }, { status: 403 })
    }

    const RolePriority: Record<string, number> = {
      ROOT: 4,
      OWNER: 3,
      ADMIN: 2,
      STAFF: 1,
      MEMBER: 0
    };

    if (authRole !== "ROOT" && targetUser.id !== authId) {
      if ((RolePriority[authRole] || 0) <= (RolePriority[targetRole] || 0)) {
        return NextResponse.json({ error: "Kendinizle aynı veya daha üst roldeki bir hesabı düzenleme yetkiniz yok." }, { status: 403 })
      }
    }

    const validRoles = ["MEMBER", "STAFF", "ADMIN", "OWNER", "ROOT"]
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json({ error: "Geçersiz rol." }, { status: 400 })
    }

    if (authRole !== "ROOT") {
      if ((RolePriority[role] || 0) >= (RolePriority[authRole] || 0)) {
         return NextResponse.json({ error: "Kendinizle aynı veya daha üst bir role atama veremezsiniz." }, { status: 403 })
      }
    }

    if (authRole !== "ROOT") {
      await prisma.pendingAction.create({
        data: {
          type: "USER_EDIT",
          requesterId: authId,
          data: { id: userId, role },
          status: "PENDING"
        }
      })
      
      return NextResponse.json({ success: true, message: "Değişiklikler ROOT onayına gönderildi. Onaylandıktan sonra geçerli olacaktır." })
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role }
    })

    return NextResponse.json({ success: true, message: "Rol başarıyla güncellendi." })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}
