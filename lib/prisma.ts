import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
  prismaDirect?: PrismaClient
  prismaUrl?: string
  prismaDirectUrl?: string
}

/** Supabase rejects Prisma unless SSL is explicit; missing sslmode often surfaces as P1001. */
export function ensurePostgresUrl(url: string) {
  if (/sslmode=/i.test(url)) return url
  return `${url}${url.includes("?") ? "&" : "?"}sslmode=require`
}

function createClient(url: string) {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: { db: { url: ensurePostgresUrl(url) } },
  })
}

export function getPrisma() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error("Prisma is not configured. Set DATABASE_URL and DIRECT_URL in .env.local (Supabase → Settings → Database).")
  }
  const resolved = ensurePostgresUrl(url)
  if (!globalForPrisma.prisma || globalForPrisma.prismaUrl !== resolved) {
    globalForPrisma.prisma = createClient(resolved)
    globalForPrisma.prismaUrl = resolved
  }
  return globalForPrisma.prisma
}

/** Interactive transactions need a session-mode connection. Supabase's transaction pooler (6543) drops them. */
export function getDirectPrisma() {
  const directUrl = process.env.DIRECT_URL
  if (!directUrl || directUrl === process.env.DATABASE_URL) return getPrisma()
  const resolved = ensurePostgresUrl(directUrl)
  if (!globalForPrisma.prismaDirect || globalForPrisma.prismaDirectUrl !== resolved) {
    globalForPrisma.prismaDirect = createClient(resolved)
    globalForPrisma.prismaDirectUrl = resolved
  }
  return globalForPrisma.prismaDirect
}
