import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdminOrOwner } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const auth = await verifyAdminOrOwner(req)
  if (!auth.valid) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })

  try {
    const { searchParams } = new URL(req.url)
    const seminarId = searchParams.get("seminarId")

    const where = seminarId ? { seminarId } : {}

    const entries = await prisma.entry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, surname: true, email: true } },
        seminar: { select: { name: true } },
      },
    })

    return NextResponse.json({ entries })
  } catch {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}
