import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
  prismaUrl?: string
}

/**
 * Prisma cannot use Supabase's transaction pooler (port 6543) reliably.
 * P1001 "Can't reach database server" is the usual symptom. Session mode on
 * 5432 (DIRECT_URL / session pooler) is the connection Prisma needs.
 */
export function preferSessionPooler(url: string) {
  let next = url.replace(/pooler\.supabase\.com:6543/gi, "pooler.supabase.com:5432")
  next = next.replace(/\/postgres&/g, "/postgres?")
  const queryIndex = next.indexOf("?")
  if (queryIndex === -1) return next
  const base = next.slice(0, queryIndex)
  const params = next
    .slice(queryIndex + 1)
    .split("&")
    .map((item) => item.trim())
    .filter((item) => item && !/^pgbouncer=/i.test(item))
  return params.length ? `${base}?${params.join("&")}` : base
}

export function ensurePostgresUrl(url: string) {
  let next = preferSessionPooler(url)
  const join = next.includes("?") ? "&" : "?"
  if (!/sslmode=/i.test(next)) next += `${join}sslmode=require`
  if (!/connect_timeout=/i.test(next)) next += `${next.includes("?") ? "&" : "?"}connect_timeout=30`
  return next
}

function createClient(url: string) {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: { db: { url } },
  })
}

function resolvePrismaUrl() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      "Prisma is not configured. Set DATABASE_URL and DIRECT_URL in .env.local (Supabase → Settings → Database).",
    )
  }
  return ensurePostgresUrl(url)
}

export function getPrisma() {
  const resolved = resolvePrismaUrl()
  if (!globalForPrisma.prisma || globalForPrisma.prismaUrl !== resolved) {
    globalForPrisma.prisma = createClient(resolved)
    globalForPrisma.prismaUrl = resolved
  }
  return globalForPrisma.prisma
}

/** Same session-mode connection as getPrisma — required for interactive transactions. */
export function getDirectPrisma() {
  return getPrisma()
}
