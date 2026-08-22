"use server"

import { requireSuperAdmin } from "@/lib/backend/session"
import { getPrisma } from "@/lib/prisma"
import { RETENTION, retentionCutoff } from "@/lib/retention/policy"
import { DOCUMENTS_BUCKET } from "@/lib/storage/paths"
import { createAdminClient } from "@/lib/supabase/admin"
import { writeAudit } from "@/lib/db/events"
import { clientIp } from "@/lib/backend/request"

export type RetentionPreview = {
  policy: typeof RETENTION
  drafts: number
  rejected: number
  completed: number
  documents: number
}

const ANONYMISED = {
  agentName: "Redacted",
  businessName: null,
  phone: null,
  email: null,
  idType: null,
  idNumber: null,
  issuedPlace: null,
  issuedDate: null,
  expireDate: null,
  gender: null,
  street: null,
  houseNumber: null,
  lat: null,
  lng: null,
  locationAccuracy: null,
  locationCapturedAt: null,
  channelParentName: null,
  channelManagerName: null,
  tinNumber: null,
  notes: null,
  adminNotes: "Purged under retention policy",
}

async function eligibleIds() {
  const prisma = getPrisma()
  const draftCutoff = retentionCutoff("draftMonths")
  const rejectedCutoff = retentionCutoff("rejectedMonths")
  const completedCutoff = retentionCutoff("completedYears")

  const [drafts, rejected, completed] = await Promise.all([
    prisma.application.findMany({
      where: { status: "DRAFT", submittedAt: null, deletedAt: null, updatedAt: { lt: draftCutoff } },
      select: { id: true, applicationNumber: true, documents: { select: { storageKey: true } } },
      take: 200,
    }),
    prisma.application.findMany({
      where: {
        status: "REJECTED",
        deletedAt: null,
        OR: [{ reviewedAt: { lt: rejectedCutoff } }, { reviewedAt: null, updatedAt: { lt: rejectedCutoff } }],
      },
      select: { id: true, applicationNumber: true, documents: { select: { storageKey: true } } },
      take: 200,
    }),
    prisma.application.findMany({
      where: {
        status: "COMPLETED",
        deletedAt: null,
        OR: [{ completedAt: { lt: completedCutoff } }, { completedAt: null, updatedAt: { lt: completedCutoff } }],
      },
      select: { id: true, applicationNumber: true, documents: { select: { storageKey: true } } },
      take: 200,
    }),
  ])

  return { drafts, rejected, completed }
}

function storageKeys(rows: Array<{ documents: Array<{ storageKey: string | null }> }>) {
  return rows.flatMap((row) => row.documents.map((doc) => doc.storageKey).filter((key): key is string => Boolean(key)))
}

export async function previewRetention(): Promise<RetentionPreview> {
  await requireSuperAdmin()
  const { drafts, rejected, completed } = await eligibleIds()
  return {
    policy: RETENTION,
    drafts: drafts.length,
    rejected: rejected.length,
    completed: completed.length,
    documents: storageKeys([...drafts, ...rejected, ...completed]).length,
  }
}

async function removeStorage(keys: string[]) {
  if (!keys.length) return
  const admin = createAdminClient()
  for (let i = 0; i < keys.length; i += 50) {
    const chunk = keys.slice(i, i + 50).filter((key) => !key.startsWith("dev-placeholder/"))
    if (!chunk.length) continue
    await admin.storage.from(DOCUMENTS_BUCKET).remove(chunk)
  }
}

export async function runRetentionPurge() {
  const { profile } = await requireSuperAdmin()
  const prisma = getPrisma()
  const { drafts, rejected, completed } = await eligibleIds()
  const closed = [...rejected, ...completed].slice(0, 50)
  const draftBatch = drafts.slice(0, 50)

  await removeStorage(storageKeys([...draftBatch, ...closed]))

  for (const row of closed) {
    await prisma.document.updateMany({
      where: { applicationId: row.id },
      data: {
        storageKey: null,
        originalName: null,
        status: "missing",
        deletedAt: new Date(),
      },
    })
    await prisma.applicationMessage.deleteMany({ where: { applicationId: row.id } }).catch(() => undefined)
    await prisma.application.update({
      where: { id: row.id },
      data: {
        ...ANONYMISED,
        rejectionReason: rejected.some((item) => item.id === row.id) ? "Purged under retention policy" : undefined,
      },
    })
  }

  if (draftBatch.length) {
    await prisma.application.deleteMany({ where: { id: { in: draftBatch.map((row) => row.id) } } })
  }

  try {
    await writeAudit({
      actorId: profile.id,
      actorRole: profile.role,
      category: "Security",
      action: "Ran retention purge",
      detail: `${draftBatch.length} drafts deleted, ${closed.length} closed cases anonymised`,
      severity: "warning",
      ipAddress: await clientIp(),
    })
  } catch {
    // Purge should succeed even if audit write fails.
  }

  return {
    draftsDeleted: draftBatch.length,
    casesAnonymised: closed.length,
    remaining:
      Math.max(0, drafts.length - draftBatch.length) + Math.max(0, rejected.length + completed.length - closed.length),
  }
}
