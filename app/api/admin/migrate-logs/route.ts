import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdminOrOwner } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const auth = await verifyAdminOrOwner(req)
  if (!auth.valid || auth.role !== "ROOT") {
    return NextResponse.json({ error: "Sadece ROOT bu işlemi yapabilir." }, { status: 403 })
  }

  try {
    const logs = await prisma.systemLog.findMany({
      where: {
        // We can't easily filter for 'is string' in SQL via Prisma
        // so we fetch all and filter in JS
      }
    })

    let fixedCount = 0
    for (const log of logs) {
      if (typeof log.details === "string") {
        try {
          const parsed = JSON.parse(log.details)
          await prisma.systemLog.update({
            where: { id: log.id },
            data: { details: parsed }
          })
          fixedCount++
        } catch (e) {
          console.error(`Failed to parse log ${log.id}:`, e)
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `${fixedCount} adet log güncellendi.`,
      totalScanned: logs.length
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
