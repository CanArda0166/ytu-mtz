import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"
import { logAction, LogSeverity } from "@/lib/logger"
import { loadSystemConfig } from "@/lib/system-config";
import { isFeatureEnabled } from "@/lib/permission";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-posta ve şifre zorunludur." },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: "E-posta veya şifre hatalı." }, { status: 401 })
    }

    const config = loadSystemConfig();
    if (!isFeatureEnabled('loginEnabled', user.role)) {
      return NextResponse.json({ error: "Sistem şu anda ROOT tarafından kilitlendi." }, { status: 403 });
    }

    if (config.emailVerificationRequired && !user.emailVerified) {
      return NextResponse.json(
        { error: "Lütfen önce e-postanızı doğrulayın." },
        { status: 401 }
      )
    }

    if (password !== user.password) {
      return NextResponse.json(
        { error: "E-posta veya şifre hatalı." },
        { status: 401 }
      )
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    )

    const response = NextResponse.json(
      { message: "Giriş başarılı.", role: user.role },
      { status: 200 }
    )

    await logAction(user.id, "Başarılı Giriş", LogSeverity.INFO, { email: user.email }, user.role)

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })

    return response
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Sunucu hatası." },
      { status: 500 }
    )
  }
}