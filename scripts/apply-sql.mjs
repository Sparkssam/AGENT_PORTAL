import { readFileSync } from "node:fs"
import pg from "pg"

const url = process.env.DIRECT_URL || process.env.DATABASE_URL
if (!url) {
  console.error("Missing DIRECT_URL (or DATABASE_URL) in .env.local")
  process.exit(1)
}

const defaultFiles = [
  "supabase/migrations/20260817120000_init.sql",
  "supabase/seed.sql",
  "supabase/migrations/20260817140000_storage.sql",
  "supabase/migrations/20260817150000_mutation_guards.sql",
  "supabase/migrations/20260819120000_document_verifications.sql",
  "supabase/migrations/20260819140000_business_sectors.sql",
  "supabase/migrations/20260821120000_document_admin_upload.sql",
  "supabase/migrations/20260822000000_performance_indexes.sql",
  "supabase/migrations/20260822010000_application_messages.sql",
]
const files = process.argv.slice(2).length ? process.argv.slice(2) : defaultFiles

function splitSql(sql) {
  const statements = []
  let current = ""
  let i = 0
  let inSingle = false
  let inDouble = false
  let dollarTag = null
  let inLineComment = false
  let inBlockComment = false

  while (i < sql.length) {
    const char = sql[i]
    const next = sql[i + 1]

    if (inLineComment) {
      current += char
      if (char === "\n") inLineComment = false
      i += 1
      continue
    }

    if (inBlockComment) {
      current += char
      if (char === "*" && next === "/") {
        current += next
        i += 2
        inBlockComment = false
        continue
      }
      i += 1
      continue
    }

    if (dollarTag) {
      if (sql.startsWith(dollarTag, i)) {
        current += dollarTag
        i += dollarTag.length
        dollarTag = null
        continue
      }
      current += char
      i += 1
      continue
    }

    if (inSingle) {
      current += char
      if (char === "'" && next === "'") {
        current += next
        i += 2
        continue
      }
      if (char === "'") inSingle = false
      i += 1
      continue
    }

    if (inDouble) {
      current += char
      if (char === '"') inDouble = false
      i += 1
      continue
    }

    if (char === "-" && next === "-") {
      current += char
      inLineComment = true
      i += 1
      continue
    }

    if (char === "/" && next === "*") {
      current += char
      inBlockComment = true
      i += 1
      continue
    }

    if (char === "'") {
      inSingle = true
      current += char
      i += 1
      continue
    }

    if (char === '"') {
      inDouble = true
      current += char
      i += 1
      continue
    }

    if (char === "$") {
      const match = sql.slice(i).match(/^(\$[A-Za-z0-9_]*\$)/)
      if (match) {
        dollarTag = match[1]
        current += dollarTag
        i += dollarTag.length
        continue
      }
    }

    if (char === ";") {
      const statement = current.trim()
      if (statement) statements.push(statement)
      current = ""
      i += 1
      continue
    }

    current += char
    i += 1
  }

  const last = current.trim()
  if (last) statements.push(last)
  return statements
}

const client = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
})

await client.connect()

try {
  for (const file of files) {
    console.log("applying", file)
    const statements = splitSql(readFileSync(file, "utf8"))
    for (const statement of statements) {
      try {
        await client.query(statement)
      } catch (error) {
        const message = String(error.message || error)
        if (/already exists/i.test(message)) continue
        console.error("failed", file)
        console.error(message)
        console.error(statement.slice(0, 180).replace(/\s+/g, " "))
        process.exit(1)
      }
    }
    console.log("ok", file, statements.length, "statements")
  }
  console.log("schema_applied")
} finally {
  await client.end()
}
