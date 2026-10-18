import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jwtVerify } from "jose"

async function verifyRoot(req: NextRequest) {
  const token = req.cookies.get("token")?.value
  if (!token) return false
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(token, secret)
    return payload.role === "ROOT"
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  if (!(await verifyRoot(req))) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")
  const severity = searchParams.get("severity")
  const role = searchParams.get("role")
  const action = searchParams.get("action")

  try {
    const logs = await prisma.systemLog.findMany({
      where: {
        ...(userId ? { userId } : {}),
        ...(severity ? { severity } : {}),
        ...(role ? { role } : {}),
        ...(action ? { action: { contains: action, mode: "insensitive" } } : {}),
      },
      include: {
        user: {
          select: { name: true, surname: true, email: true, role: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 500
    })

    return NextResponse.json({ logs })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}
