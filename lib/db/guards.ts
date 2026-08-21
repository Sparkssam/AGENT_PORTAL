import { Prisma } from "@prisma/client"
import { getDirectPrisma } from "@/lib/prisma"

/** Status/numbering triggers check auth.uid(); Prisma uses the DB role, so enable the SQL bypass for one transaction. */
export async function withDbGuards<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
  const prisma = getDirectPrisma()
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT set_config('kinetic.bypass_guards', 'on', true)`
      return fn(tx)
    },
    {
      maxWait: 15_000,
      timeout: 30_000,
    },
  )
}
