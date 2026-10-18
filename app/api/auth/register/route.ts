import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { sendVerificationEmail } from "@/lib/email"
import { loadSystemConfig } from "@/lib/system-config"

export async function POST(req: NextRequest) {
  try {
    const config = loadSystemConfig()
    if (!config.registrationEnabled) {
      return NextResponse.json({ error: "Sistem şu anda ROOT tarafından kilitlendi." }, { status: 403 })
    }

    const body = await req.json()
    const {
      name, surname, email, phone, birthDate,
      tcNo, gender, university, faculty, department, password,
    } = body

    if (!name || !surname || !email || !phone || !birthDate || !tcNo || !password || !gender) {
      return NextResponse.json(
        { error: "Tüm zorunlu alanları (Cinsiyet dahil) doldurun." },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: "Bu e-posta zaten kayıtlı." },
        { status: 400 }
      )
    }

    const user = await prisma.user.create({
      data: {
        name, surname, email, phone,
        birthDate: new Date(birthDate),
        tcNo,
        gender,
        university, faculty, department,
        password,
        role: "MEMBER",
        emailVerified: !config.emailVerificationRequired,
      },
    })

    if (config.emailVerificationRequired) {
      const token = crypto.randomBytes(32).toString("hex")

      await prisma.token.create({
        data: {
          userId: user.id,
          token,
          type: "EMAIL_VERIFICATION",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      })

      await sendVerificationEmail(email, token, name)

      return NextResponse.json(
        { message: "Kayıt başarılı. Lütfen e-postanızı doğrulayın." },
        { status: 201 }
      )
    }

    return NextResponse.json(
      { message: "Kayıt başarılı. Giriş yapabilirsiniz." },
      { status: 201 }
    )
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Sunucu hatası." },
      { status: 500 }
    )
  }
}