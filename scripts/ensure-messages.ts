import { getPrisma } from "../lib/prisma"

const CREATE_MESSAGES_TABLE = `
CREATE TABLE IF NOT EXISTS public.application_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications (id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
)`

const CREATE_MESSAGES_INDEX = `
CREATE INDEX IF NOT EXISTS application_messages_application_id_idx
  ON public.application_messages (application_id, created_at)`

async function main() {
  const prisma = getPrisma()
  await prisma.$executeRawUnsafe(CREATE_MESSAGES_TABLE)
  await prisma.$executeRawUnsafe(CREATE_MESSAGES_INDEX)
  const [{ exists }] = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
    `SELECT to_regclass('public.application_messages') IS NOT NULL AS exists`,
  )
  console.log(exists ? "application_messages_ready" : "application_messages_missing")
  await prisma.$disconnect()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
