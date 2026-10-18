import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token")

    if (!token) {
      return NextResponse.redirect(new URL("/login?error=invalid-token", req.url))
    }

    const tokenRecord = await prisma.token.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!tokenRecord || tokenRecord.type !== "EMAIL_VERIFICATION") {
      return NextResponse.redirect(new URL("/login?error=invalid-token", req.url))
    }

    if (tokenRecord.expiresAt < new Date()) {
      await prisma.token.delete({ where: { token } })
      return NextResponse.redirect(new URL("/login?error=expired-token", req.url))
    }

    await prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { emailVerified: true },
    })

    await prisma.token.delete({ where: { token } })

    return NextResponse.redirect(new URL("/login?verified=true", req.url))
  } catch (error) {
    console.error(error)
    return NextResponse.redirect(new URL("/login?error=server-error", req.url))
  }
}