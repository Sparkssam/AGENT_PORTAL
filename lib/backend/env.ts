import { getR2Env, isR2Configured as r2Configured, requireR2Env as requireR2 } from "@/lib/storage/r2-client"

export function isPrismaConfigured() {
  return Boolean(process.env.DATABASE_URL)
}

/** True when the public Supabase env is present (browser + server). */
export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

/** True when R2 signing credentials are present (server only). */
export function isR2Configured() {
  return r2Configured()
}

export function requireSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.")
  }
  return { url, anonKey }
}

export function requireR2Env() {
  return requireR2()
}

export { getR2Env }
