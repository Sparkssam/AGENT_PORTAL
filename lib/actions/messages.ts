"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { BackendError } from "@/lib/backend/errors"
import { getAuthContext } from "@/lib/backend/session"
import { clientIp } from "@/lib/backend/request"
import { getPrisma } from "@/lib/prisma"
import { emitNotification, writeAudit } from "@/lib/db/events"
import { assertAgentOwnsApplication, isStaffRole } from "@/lib/db/ownership"

const messageSchema = z.object({
  applicationId: z.string().uuid(),
  body: z.string().trim().min(1).max(2000),
})

export type ApplicationMessageView = {
  id: string
  body: string
  createdAt: string
  authorId: string
  authorName: string
  authorRole: "agent" | "admin"
  mine: boolean
}

type MessageRow = {
  id: string
  body: string
  created_at: Date | string
  author_id: string
  full_name: string | null
  email: string | null
  role: string
}

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

let ensurePromise: Promise<void> | null = null

function errorText(error: unknown) {
  if (error instanceof Error) return error.message
  return String(error)
}

export async function ensureApplicationMessagesTable() {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      const prisma = getPrisma()
      await prisma.$executeRawUnsafe(CREATE_MESSAGES_TABLE)
      await prisma.$executeRawUnsafe(CREATE_MESSAGES_INDEX)
    })().catch((error) => {
      ensurePromise = null
      throw error
    })
  }
  await ensurePromise
}

function toIso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function toView(row: MessageRow, profileId: string): ApplicationMessageView {
  return {
    id: row.id,
    body: row.body,
    createdAt: toIso(row.created_at),
    authorId: row.author_id,
    authorName: row.full_name || row.email || "User",
    authorRole: isStaffRole(row.role) ? "admin" : "agent",
    mine: row.author_id === profileId,
  }
}

async function assertCanAccessApplication(applicationId: string) {
  const { profile } = await getAuthContext()
  const prisma = getPrisma()
  const app = await prisma.application.findFirst({
    where: { id: applicationId, deletedAt: null },
    select: {
      id: true,
      agentId: true,
      applicationNumber: true,
      agent: { select: { userId: true } },
    },
  })
  if (!app) throw new BackendError("APPLICATION", "Application not found", 404)

  const staff = isStaffRole(profile.role)
  if (!staff) {
    const agent = await prisma.agent.findUnique({ where: { userId: profile.id }, select: { id: true } })
    assertAgentOwnsApplication(agent?.id, app.agentId)
  }

  return { profile, prisma, app, staff }
}

export async function listApplicationMessages(applicationId: string) {
  const { profile, prisma } = await assertCanAccessApplication(applicationId)
  await ensureApplicationMessagesTable()

  const rows = await prisma.$queryRaw<MessageRow[]>(Prisma.sql`
    SELECT
      m.id,
      m.body,
      m.created_at,
      m.author_id,
      p.full_name,
      p.email,
      p.role::text AS role
    FROM public.application_messages m
    JOIN public.profiles p ON p.id = m.author_id
    WHERE m.application_id = ${applicationId}::uuid
    ORDER BY m.created_at ASC
    LIMIT 200
  `)
  return rows.map((row) => toView(row, profile.id))
}

export async function postApplicationMessage(applicationId: string, body: string) {
  const parsed = messageSchema.parse({ applicationId, body })
  const { profile, prisma, app, staff } = await assertCanAccessApplication(parsed.applicationId)
  await ensureApplicationMessagesTable()

  let created: { id: string; body: string; created_at: Date | string; author_id: string }
  try {
    const inserted = await prisma.$queryRaw<Array<{ id: string; body: string; created_at: Date | string; author_id: string }>>(
      Prisma.sql`
        INSERT INTO public.application_messages (application_id, author_id, body)
        VALUES (${parsed.applicationId}::uuid, ${profile.id}::uuid, ${parsed.body})
        RETURNING id, body, created_at, author_id
      `,
    )
    const row = inserted[0]
    if (!row) throw new BackendError("APPLICATION", "Could not save the message", 500)
    created = row
  } catch (error) {
    throw new BackendError("APPLICATION", errorText(error) || "Could not send the message", 500)
  }

  const preview = parsed.body.slice(0, 180)
  const caseLabel = app.applicationNumber ?? parsed.applicationId

  if (staff) {
    if (app.agent.userId !== profile.id) {
      await emitNotification({
        userId: app.agent.userId,
        category: "application",
        title: `Message on ${caseLabel}`,
        message: preview,
        entityType: "application",
        entityId: parsed.applicationId,
      })
    }
  } else {
    const reviewers = await prisma.profile.findMany({
      where: { role: { in: ["admin", "super_admin"] } },
      select: { id: true },
      take: 25,
    })
    await Promise.all(
      reviewers
        .filter((reviewer) => reviewer.id !== profile.id)
        .map((reviewer) =>
          emitNotification({
            userId: reviewer.id,
            category: "application",
            title: `Agent message on ${caseLabel}`,
            message: `${profile.fullName}: ${preview}`,
            entityType: "application",
            entityId: parsed.applicationId,
          }),
        ),
    )
  }

  await writeAudit({
    actorId: profile.id,
    actorRole: profile.role,
    category: "Application",
    action: "Posted application message",
    detail: preview,
    entityType: "application",
    entityId: parsed.applicationId,
    target: caseLabel,
    ipAddress: await clientIp(),
  })

  return {
    id: created.id,
    body: created.body,
    createdAt: toIso(created.created_at),
    authorId: created.author_id,
    authorName: profile.fullName || profile.email,
    authorRole: staff ? "admin" : "agent",
    mine: true,
  } satisfies ApplicationMessageView
}
