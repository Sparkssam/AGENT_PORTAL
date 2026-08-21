import { PrismaClient } from "@prisma/client"

async function main() {
  const prisma = new PrismaClient()
  try {
    await prisma.$queryRawUnsafe("SELECT 1 as ok")
    const tables = await prisma.$queryRawUnsafe(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
    )
    const names = tables.map((row) => row.tablename)
    console.log("connected")
    console.log("table_count", names.length)
    console.log("tables", names.join(","))
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
