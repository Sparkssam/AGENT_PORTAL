import { readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"
import { createClient } from "@supabase/supabase-js"

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local")
  if (!existsSync(path)) throw new Error("Missing .env.local")
  const env = {}
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
  }
  return env
}

const env = loadEnvLocal()
const url = env.NEXT_PUBLIC_SUPABASE_URL
const service = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !service) {
  console.error("Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local")
  process.exit(1)
}

const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } })

async function tableExists() {
  const { error } = await admin.from("profiles").select("id").limit(1)
  if (!error) return true
  const msg = error.message || ""
  if (/schema cache|does not exist|Could not find/i.test(msg)) return false
  console.log("profiles probe:", error.code || "", msg.slice(0, 180))
  return false
}

async function trySql(sql) {
  const endpoints = [
    `${url}/pg/query`,
    `${url}/pg-meta/default/query`,
    `${url}/pg-meta/query`,
  ]
  for (const endpoint of endpoints) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: service,
        Authorization: `Bearer ${service}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    })
    const text = await res.text()
    if (res.ok) return { ok: true, endpoint }
    if (res.status !== 404) {
      return { ok: false, endpoint, status: res.status, body: text.slice(0, 300) }
    }
  }
  return { ok: false, endpoint: "none", status: 404, body: "No SQL HTTP endpoint" }
}

const exists = await tableExists()
console.log("profiles_table", exists ? "present" : "missing")

if (!exists) {
  const init = readFileSync("supabase/migrations/20260817120000_init.sql", "utf8")
  const seed = readFileSync("supabase/seed.sql", "utf8")
  const storage = readFileSync("supabase/migrations/20260817140000_storage.sql", "utf8")
  const guards = readFileSync("supabase/migrations/20260817150000_mutation_guards.sql", "utf8")
  const result = await trySql(`${init};\n${seed};\n${storage};\n${guards}`)
  console.log("sql_apply", JSON.stringify(result))
} else {
  const storage = readFileSync("supabase/migrations/20260817140000_storage.sql", "utf8")
  const result = await trySql(storage)
  console.log("storage_apply", JSON.stringify(result))
}
