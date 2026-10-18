import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdminOrOwner } from "@/lib/auth"
import { existsSync, readFileSync } from "fs"
import { logAction, LogSeverity } from "@/lib/logger"

function loadPermissions(): Record<string, boolean> {
  const PERMS_FILE = process.cwd() + "/permissions.json"
  try {
    if (existsSync(PERMS_FILE)) {
      return JSON.parse(readFileSync(PERMS_FILE, "utf-8"))
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

const RolePriority: Record<string, number> = {
  ROOT: 4,
  OWNER: 3,
  ADMIN: 2,
  STAFF: 1,
  MEMBER: 0
};

export async function GET(req: NextRequest) {
  const auth = await verifyAdminOrOwner(req)
  if (!auth.valid) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, surname: true, email: true,
        phone: true, birthDate: true, tcNo: true, gender: true,
        university: true, faculty: true, department: true,
        role: true, emailVerified: true, createdAt: true,
        password: (auth.role === "ROOT"), // Sadece ROOT'a şifreyi dön
      },
    })

    const perms = loadPermissions()

    const maskedUsers = users.map(u => {
      let currentRole = u.role as string;
      if (currentRole === "ROOT" && (auth.role as string) !== "ROOT") {
        currentRole = "MEMBER";
      }

      const userWithMaskedRole = { ...u, role: currentRole };

      if (auth.role !== "ROOT") {
        delete (userWithMaskedRole as any).password;
      }

      const roleStr = (auth.role as string).toLowerCase()
      const canViewTc = perms[`${roleStr}.can_view_tc`]
      const canViewPhone = perms[`${roleStr}.can_view_phone`]
      const canViewEmail = perms[`${roleStr}.can_view_email`]
      const canViewSurname = perms[`${roleStr}.can_view_surname`]
      
      const isSelf = auth.userId === u.id
      const bypassMasking = (auth.role === "ROOT" || isSelf)

      return {
        ...userWithMaskedRole,
        surname: (bypassMasking || canViewSurname) ? u.surname : maskName(u.surname),
        tcNo: (bypassMasking || canViewTc) ? u.tcNo : maskTc(u.tcNo),
        phone: (bypassMasking || canViewPhone) ? u.phone : maskPhone(u.phone),
        email: (bypassMasking || canViewEmail) ? u.email : maskEmail(u.email),
      }
    })

    return NextResponse.json({ users: maskedUsers })
  } catch {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await verifyAdminOrOwner(req)
  if (!auth.valid) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })

  const perms = loadPermissions()
  const isHighRole = auth.role === "OWNER" || auth.role === "ROOT"
  if (!isHighRole && !perms[`${auth.role!.toLowerCase()}.can_delete_users`]) {
    return NextResponse.json({ error: "Kullanıcı silme yetkiniz yok." }, { status: 403 })
  }

  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: "ID zorunludur." }, { status: 400 })

    const targetUser = await prisma.user.findUnique({ where: { id } })
    if (!targetUser) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 })

    const authRole = auth.role as string
    const targetRole = targetUser.role as string

    if (authRole !== "ROOT") {
      if ((RolePriority[authRole] || 0) <= (RolePriority[targetRole] || 0)) {
        return NextResponse.json({ error: "Kendinizle aynı veya daha üst roldeki bir hesabı silme yetkiniz yok." }, { status: 403 })
      }
    }

    if ((auth.role as string) !== "ROOT") {
      await prisma.pendingAction.create({
        data: {
          type: "USER_DELETE",
          requesterId: auth.userId!,
          data: { id },
          status: "PENDING"
        }
      })
      
      await logAction(auth.userId!, "Kullanıcı Silme Onaya Gönderildi", LogSeverity.WARNING, { deletedUserId: id }, auth.role)
      return NextResponse.json({ message: "Silme işlemi ROOT onayına gönderildi. Onaylandıktan sonra gerçekleşecektir." })
    }

    await logAction(auth.userId!, "Kullanıcı Silindi (Direct)", LogSeverity.CRITICAL, { deletedUserId: id }, auth.role)
    
    // User silindiğinde Cascade sayesinde Token ve Entry'ler otomatik silinecektir (schema.prisma'da tanımlandığı üzere)
    await prisma.user.delete({ where: { id } })

    return NextResponse.json({ message: "Kullanıcı başarıyla silindi." })
  } catch (error: any) {
    console.error("Delete Error:", error)
    return NextResponse.json({ error: "Sunucu hatası: " + (error.message || "Bilinmeyen hata") }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const auth = await verifyAdminOrOwner(req)
  if (!auth.valid) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })

  const perms = loadPermissions()
  const isHighRole = auth.role === "OWNER" || auth.role === "ROOT"
  if (!isHighRole && !perms[`${auth.role!.toLowerCase()}.can_edit_users`]) {
    return NextResponse.json({ error: "Kullanıcı düzenleme yetkiniz yok." }, { status: 403 })
  }

  try {
    const isMasked = (val: any) => typeof val === "string" && val.includes("*")
    const body = await req.json()
    const { id, name, surname, email, phone, tcNo, gender, university, faculty, department, role, password, birthDate, emailVerified } = body

    if (!id) return NextResponse.json({ error: "ID zorunludur." }, { status: 400 })

    const targetUser = await prisma.user.findUnique({ where: { id } })
    if (!targetUser) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 })

    const authRole = auth.role as string
    const targetRole = targetUser.role as string

    if (targetRole === "ROOT" && authRole !== "ROOT") {
      return NextResponse.json({ error: "ROOT kullanıcısı üzerinde değişiklik yapma yetkiniz yok." }, { status: 403 })
    }

    if (authRole !== "ROOT" && targetUser.id !== auth.userId) {
      if ((RolePriority[authRole] || 0) <= (RolePriority[targetRole] || 0)) {
        return NextResponse.json({ error: "Kendinizle aynı veya daha üst roldeki bir hesabı düzenleme yetkiniz yok." }, { status: 403 })
      }
    }

    if (password && (auth.role as string) !== "ROOT") {
      return NextResponse.json({ error: "Şifre değiştirme yetkisi sadece ROOT kullanıcıya aittir." }, { status: 403 })
    }

    const roleStr = auth.role!.toLowerCase()
    
    const updateData: any = {}
    
    if (name !== undefined || surname !== undefined) {
      if (auth.role === "ROOT" || perms[`${roleStr}.can_edit_user_name`]) {
        if (name !== undefined && !isMasked(name)) updateData.name = name
        if (surname !== undefined && !isMasked(surname)) updateData.surname = surname
      }
    }

    if (email !== undefined && !isMasked(email)) {
      if (auth.role === "ROOT" || perms[`${roleStr}.can_edit_user_email`]) {
        updateData.email = email
      }
    }

    if (phone !== undefined && !isMasked(phone)) {
      if (auth.role === "ROOT" || perms[`${roleStr}.can_edit_user_phone`]) {
        updateData.phone = phone
      }
    }

    if (tcNo !== undefined && !isMasked(tcNo)) {
      if (auth.role === "ROOT" || perms[`${roleStr}.can_edit_user_tc`]) {
        updateData.tcNo = tcNo
      }
    }

    if (role !== undefined) {
      if (auth.role === "ROOT") {
        updateData.role = role
      } else if (perms[`${roleStr}.can_edit_user_role`]) {
        const targetRolePriority = RolePriority[role as string] || 0;
        const authRolePriority = RolePriority[auth.role as string] || 0;
        if (targetRolePriority >= authRolePriority) {
          return NextResponse.json({ error: "Kendinizle aynı veya daha üst bir rol tanımlama yetkiniz yok." }, { status: 403 })
        }
        updateData.role = role
      }
    }
    
    if (emailVerified !== undefined) {
      if (auth.role === "ROOT" || perms[`${roleStr}.can_verify_emails_manually`]) {
        updateData.emailVerified = emailVerified
      }
    }

    if (university !== undefined && (auth.role === "ROOT" || perms[`${roleStr}.can_edit_user_university`])) {
      updateData.university = university
    }
    if (faculty !== undefined && (auth.role === "ROOT" || perms[`${roleStr}.can_edit_user_faculty`])) {
      updateData.faculty = faculty
    }
    if (department !== undefined && (auth.role === "ROOT" || perms[`${roleStr}.can_edit_user_department`])) {
      updateData.department = department
    }
    if (gender !== undefined && (auth.role === "ROOT" || perms[`${roleStr}.can_edit_user_gender`])) {
      updateData.gender = gender
    }
    if (birthDate !== undefined && (auth.role === "ROOT" || perms[`${roleStr}.can_edit_user_birthdate`])) {
      updateData.birthDate = new Date(birthDate)
    }

    if (password && password.trim() !== "") {
      if (auth.role === "ROOT") {
        updateData.password = password
      } else {
        return NextResponse.json({ error: "Şifre değiştirme yetkisi sadece ROOT kullanıcıya aittir." }, { status: 403 })
      }
    }

    if (Object.keys(updateData).length === 0) {
       return NextResponse.json({ error: "Güncellenecek alanlar için yetkiniz yok." }, { status: 403 })
    }

    if ((auth.role as string) !== "ROOT") {
      const oldValues: any = {
        name: targetUser.name,
        surname: targetUser.surname,
        email: targetUser.email,
        phone: targetUser.phone,
        tcNo: targetUser.tcNo,
        role: targetUser.role,
        gender: targetUser.gender || "-",
        university: targetUser.university || "-",
        faculty: targetUser.faculty || "-",
        department: targetUser.department || "-",
        birthDate: targetUser.birthDate ? targetUser.birthDate.toISOString().split('T')[0] : "-",
        emailVerified: targetUser.emailVerified
      }

      await prisma.pendingAction.create({
        data: {
          type: "USER_EDIT",
          requesterId: auth.userId!,
          data: { 
            id, 
            newValues: updateData, 
            oldValues: oldValues 
          },
          status: "PENDING"
        }
      })
      
      await logAction(auth.userId!, "Kullanıcı Düzenleme Onaya Gönderildi", LogSeverity.INFO, { targetUserId: id, updates: updateData }, auth.role)
      return NextResponse.json({ message: "Değişiklikler ROOT onayına gönderildi. Onaylandıktan sonra geçerli olacaktır." })
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData
    })

    await logAction(auth.userId!, "Kullanıcı Güncellendi (Direct)", LogSeverity.INFO, { updatedUserId: id, updates: updateData }, auth.role)

    return NextResponse.json({ message: "Kullanıcı başarıyla güncellendi.", user: updatedUser })
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Bu e-posta adresi sistemde kayıtlı." }, { status: 400 })
    }
    return NextResponse.json({ error: "Güncelleme sırasında bir hata oluştu." }, { status: 500 })
  }
}
