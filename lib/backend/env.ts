export function isPrismaConfigured() {
  return Boolean(process.env.DATABASE_URL)
}

/** True when the public Supabase env is present (browser + server). */
export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

/** True when R2 signing credentials are present (server only). */
export function isR2Configured() {
  return Boolean(
    process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET &&
      process.env.R2_ENDPOINT,
  )
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
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucket = process.env.R2_BUCKET
  const endpoint = process.env.R2_ENDPOINT
  if (!accessKeyId || !secretAccessKey || !bucket || !endpoint) {
    throw new Error("Cloudflare R2 is not configured. Set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, and R2_ENDPOINT.")
  }
  return {
    accessKeyId,
    secretAccessKey,
    bucket,
    endpoint,
    region: process.env.R2_REGION || "auto",
    accountId: process.env.R2_ACCOUNT_ID,
  }
}
