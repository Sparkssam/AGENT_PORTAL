import type { Prisma } from "@prisma/client"
import { getPrisma } from "@/lib/prisma"
import { sendOperationalEmail } from "@/lib/email/send"

export async function writeAudit(input: {
  actorId?: string | null
  actorRole?: string | null
  category: Prisma.AuditLogCreateInput["category"]
  action: string
  detail?: string
  severity?: Prisma.AuditLogCreateInput["severity"]
  entityType?: string
  entityId?: string
  target?: string
  ipAddress?: string | null
}) {
  const prisma = getPrisma()
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      actorRole: input.actorRole,
      category: input.category,
      action: input.action,
      detail: input.detail ?? "",
      severity: input.severity ?? "info",
      entityType: input.entityType,
      entityId: input.entityId,
      target: input.target,
      ipAddress: input.ipAddress ?? undefined,
    },
  })
}

export async function emitNotification(input: {
  userId: string
  category: Prisma.NotificationCreateInput["category"]
  title: string
  message: string
  entityType?: string
  entityId?: string
  email?: boolean
}) {
  const prisma = getPrisma()
  await prisma.notification.create({
    data: {
      userId: input.userId,
      category: input.category,
      title: input.title,
      message: input.message,
      entityType: input.entityType,
      entityId: input.entityId,
    },
  })

  if (!input.email) return
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: input.userId },
      select: { email: true },
    })
    if (!profile?.email) return
    await sendOperationalEmail({
      to: profile.email,
      subject: input.title,
      text: input.message,
    })
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[email skipped]", error instanceof Error ? error.message : error)
    }
  }
}
