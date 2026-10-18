import { prisma } from "@/lib/prisma"

export async function syncExpiredSeminars() {
  const now = new Date()
  try {
    const expiredActiveSeminars = await prisma.seminar.findMany({
      where: {
        isActive: true,
        endTime: {
          lt: now
        }
      }
    })

    if (expiredActiveSeminars.length > 0) {
      await prisma.seminar.updateMany({
        where: {
          id: { in: expiredActiveSeminars.map(s => s.id) }
        },
        data: {
          isActive: false
        }
      })
    }
  } catch (error) {
    console.error("Error syncing expired seminars:", error)
  }
}
