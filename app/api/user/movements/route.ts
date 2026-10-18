import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jwtVerify } from "jose"

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value
    if (!token) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 })

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(token, secret)
    const userId = payload.id as string

    const entries = await prisma.entry.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" }, // Eskiden yeniye doğru sırala
      include: {
        seminar: {
          select: { name: true }
        }
      }
    })

    const sessions = [];
    let currentSessions = new Map();

    for (const entry of entries) {
      if (entry.type === "CHECKIN") {
        const newSession = {
          id: entry.id,
          seminarName: entry.seminar.name,
          checkIn: entry.createdAt,
          checkOut: null
        };
        sessions.push(newSession);
        currentSessions.set(entry.seminarId, newSession);
      } else if (entry.type === "CHECKOUT") {
        const activeSession = currentSessions.get(entry.seminarId);
        if (activeSession) {
          activeSession.checkOut = entry.createdAt;
          currentSessions.delete(entry.seminarId); // Kapat
        } else {
          sessions.push({
            id: entry.id,
            seminarName: entry.seminar.name,
            checkIn: null,
            checkOut: entry.createdAt
          });
        }
      }
    }

    sessions.reverse();

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}
