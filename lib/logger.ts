import { prisma } from "./prisma"

export enum LogSeverity {
  INFO = "INFO",
  WARNING = "WARNING",
  CRITICAL = "CRITICAL"
}

/**
 * Sistemdeki eylemleri kaydetmek için kullanılır.
 * @param userId Eylemi gerçekleştiren kullanıcının ID'si
 * @param action Eylemin kısa açıklaması (örn: "Kullanıcı Silindi")
 * @param severity Önem derecesi (INFO, WARNING, CRITICAL)
 * @param details JSON formatında ek detaylar (örn: { deletedUserId: "...", oldData: "..." })
 * @param role Eylemi yapanın o anki rolü
 */
export async function logAction(
  userId: string,
  action: string,
  severity: LogSeverity = LogSeverity.INFO,
  details: any = null,
  role: string | null = null
) {
  try {
    await prisma.systemLog.create({
      data: {
        userId,
        action,
        severity,
        details: details ? JSON.parse(JSON.stringify(details)) : null,
        role
      }
    })
  } catch (error) {
    console.error("Logging error:", error)
  }
}
