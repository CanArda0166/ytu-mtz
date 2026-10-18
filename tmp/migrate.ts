import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function migrate() {
  console.log("Migrating stringified logs to JSON objects...")
  
  const logs = await prisma.systemLog.findMany()
  console.log(`Scanning ${logs.length} logs...`)
  
  let fixedCount = 0
  for (const log of logs) {
    if (typeof log.details === "string") {
      try {
        const parsed = JSON.parse(log.details)
        await prisma.systemLog.update({
          where: { id: log.id },
          data: { details: parsed as any }
        })
        fixedCount++
      } catch (e: any) {
        console.error(`Failed to parse log ${log.id}:`, e.message)
      }
    }
  }
  
  console.log(`Migration completed. Fixed ${fixedCount} logs.`)
  await prisma.$disconnect()
}

migrate()
