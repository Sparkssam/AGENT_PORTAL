import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
  prismaDirect?: PrismaClient
}

function createClient(url?: string) {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    ...(url ? { datasources: { db: { url } } } : {}),
  })
}

export function getPrisma() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Prisma is not configured. Set DATABASE_URL and DIRECT_URL in .env.local (Supabase → Settings → Database).")
  }
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient()
  }
  return globalForPrisma.prisma
}

/** Interactive transactions need a session-mode connection. Supabase's pooler (6543) drops them. */
export function getDirectPrisma() {
  const directUrl = process.env.DIRECT_URL
  if (!directUrl || directUrl === process.env.DATABASE_URL) return getPrisma()
  if (!globalForPrisma.prismaDirect) {
    globalForPrisma.prismaDirect = createClient(directUrl)
  }
  return globalForPrisma.prismaDirect
}
