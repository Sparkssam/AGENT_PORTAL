"use server"

import { cache } from "react"
import { mapPrismaNotification } from "@/lib/db/mappers"
import { getAuthContext } from "@/lib/backend/session"
import { getPrisma } from "@/lib/prisma"

export const listNotifications = cache(async function listNotifications(limit = 50) {
  const { profile } = await getAuthContext()
  const data = await getPrisma().notification.findMany({
    where: { userId: profile.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  })
  return data.map(mapPrismaNotification)
})

export async function markRead(notificationId: string) {
  const { profile } = await getAuthContext()
  await getPrisma().notification.updateMany({
    where: { id: notificationId, userId: profile.id },
    data: { readAt: new Date() },
  })
}

export async function markAllRead() {
  const { profile } = await getAuthContext()
  await getPrisma().notification.updateMany({
    where: { userId: profile.id, readAt: null },
    data: { readAt: new Date() },
  })
}
