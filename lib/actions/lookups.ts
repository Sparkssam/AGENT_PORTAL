"use server"

import { unstable_cache } from "next/cache"
import { getAuthContext } from "@/lib/backend/session"
import { getPrisma } from "@/lib/prisma"
import { sortBusinessSectors } from "@/lib/lookups/catalog"

const loadLookupRows = unstable_cache(
  async () => {
    const prisma = getPrisma()
    const [channels, sectors] = await Promise.all([
      prisma.channel.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, code: true },
      }),
      prisma.businessSector.findMany({ where: { active: true }, select: { id: true, name: true, code: true } }),
    ])
    return { channels, sectors: sortBusinessSectors(sectors) }
  },
  ["lookups-active-v1"],
  { revalidate: 300 },
)

export async function listLookups() {
  await getAuthContext()
  return loadLookupRows()
}
