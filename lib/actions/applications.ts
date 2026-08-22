"use server"

import type { Application, AppStatus } from "@/lib/admin-data"
import { applicationDraftSchema, appStatusSchema, correctionRequestSchema } from "@/lib/backend/zod"
import { signedStoredUrl } from "@/lib/storage/resolver"
import { countCompleteFields, assertAdminTransition } from "@/lib/backend/status"
import { mapPrismaApplication, mapPrismaDocument, type PrismaApplicationBundle } from "@/lib/db/mappers"
import { BackendError, NotFoundError } from "@/lib/backend/errors"
import { getAuthContext, requireAdmin, requireAgent } from "@/lib/backend/session"
import { clientIp } from "@/lib/backend/request"
import {
  CHANNEL_MANAGER_NAME,
  CHANNEL_PARENT_NAME,
  CHANNEL_PARENT_TYPE,
  CHANNEL_TIER,
  isAllowedIdType,
  isChannelManagerType,
} from "@/lib/lookups/catalog"
import { getPrisma } from "@/lib/prisma"
import { withDbGuards } from "@/lib/db/guards"
import { emitNotification, writeAudit } from "@/lib/db/events"
import { assertAgentOwnsApplication, assertAgentWritable, isStaffRole } from "@/lib/db/ownership"
import { findLatestVerifications } from "@/lib/db/verification-store"
import { cache } from "react"
import { Prisma } from "@prisma/client"

const applicationInclude = {
  documents: { where: { deletedAt: null }, include: { type: true } },
  statusHistory: {
    orderBy: { createdAt: "desc" as const },
    include: { changedBy: { select: { fullName: true } } },
  },
  deposit: true,
  channel: true,
  sector: true,
  agent: { select: { agentCode: true } },
  correctionRequests: {
    where: { resolvedAt: null },
    orderBy: { createdAt: "desc" as const },
    take: 1,
    include: { items: true },
  },
} satisfies Prisma.ApplicationInclude

const listInclude = {
  documents: { where: { deletedAt: null }, include: { type: true } },
  deposit: true,
  channel: true,
  sector: true,
  agent: { select: { agentCode: true } },
  correctionRequests: {
    where: { resolvedAt: null },
    orderBy: { createdAt: "desc" as const },
    take: 1,
    include: { items: true },
  },
} satisfies Prisma.ApplicationInclude

const LOOKUP_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

async function latestVerifications(documentIds: string[]) {
  if (!documentIds.length) return new Map<string, never>()
  try {
    return await findLatestVerifications(documentIds)
  } catch {
    return new Map<string, never>()
  }
}

function mapApplicationWithChecks(
  row: PrismaApplicationBundle,
  checks: Awaited<ReturnType<typeof latestVerifications>>,
) {
  const mapped = mapPrismaApplication(row)
  mapped.documents = row.documents.map((doc) => mapPrismaDocument(doc, checks.get(doc.id)))
  return mapped
}

async function loadApplicationBundle(applicationId: string) {
  const { profile } = await getAuthContext()
  const prisma = getPrisma()
  const isAdmin = isStaffRole(profile.role)

  const row = await prisma.application.findFirst({
    where: { id: applicationId, deletedAt: null },
    include: applicationInclude,
  })
  if (!row) throw new NotFoundError("Application not found")

  if (!isAdmin) {
    const agent = await prisma.agent.findUnique({ where: { userId: profile.id } })
    assertAgentOwnsApplication(agent?.id, row.agentId)
  }

  const mapped = mapApplicationWithChecks(row as PrismaApplicationBundle, await latestVerifications(row.documents.map((doc) => doc.id)))
  mapped.documents = await Promise.all(
    mapped.documents.map(async (doc, index) => {
      const storageKey = row.documents[index]?.storageKey
      if (!storageKey) return doc
      try {
        const signedUrl = await signedStoredUrl(storageKey, { disposition: "inline" })
        return { ...doc, previewUrl: signedUrl, fileUrl: signedUrl }
      } catch {
        return doc
      }
    }),
  )

  return { prisma, profile, row, mapped, isAdmin }
}

export const listApplications = cache(async function listApplications(filters?: {
  query?: string
  status?: AppStatus
  channelId?: string
  sectorId?: string
}): Promise<Application[]> {
  const { profile } = await getAuthContext()
  const prisma = getPrisma()
  const isAdmin = isStaffRole(profile.role)

  const where: Prisma.ApplicationWhereInput = { deletedAt: null }
  if (!isAdmin) {
    const agent = await prisma.agent.findUnique({ where: { userId: profile.id } })
    if (!agent) return []
    where.agentId = agent.id
  }
  if (filters?.status) where.status = filters.status
  if (filters?.channelId) where.channelId = filters.channelId
  if (filters?.sectorId) where.sectorId = filters.sectorId
  if (filters?.query) {
    const q = filters.query
    where.OR = [
      { applicationNumber: { contains: q, mode: "insensitive" } },
      { agentName: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { idNumber: { contains: q, mode: "insensitive" } },
    ]
  }

  const rows = await prisma.application.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: listInclude,
  })
  return rows.map((row) =>
    mapApplicationWithChecks({ ...row, statusHistory: [] } as PrismaApplicationBundle, new Map()),
  )
})

export async function listApplicationSummaries() {
  const { profile } = await getAuthContext()
  const prisma = getPrisma()
  const isAdmin = isStaffRole(profile.role)
  const where: Prisma.ApplicationWhereInput = { deletedAt: null }
  if (!isAdmin) {
    const agent = await prisma.agent.findUnique({ where: { userId: profile.id } })
    if (!agent) return []
    where.agentId = agent.id
  }
  const rows = await prisma.application.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      agentId: true,
      agentName: true,
      applicationNumber: true,
      status: true,
    },
  })
  return rows.map((row) => ({
    id: row.id,
    agentId: row.agentId,
    agentName: row.agentName ?? "",
    appNumber: row.applicationNumber ?? "DRAFT",
    status: row.status,
  }))
}

export async function getApplication(id: string): Promise<Application> {
  const { mapped } = await loadApplicationBundle(id)
  return mapped
}

const DRAFT_COLUMNS: Record<string, string> = {
  fullName: "agentName",
  phone: "phone",
  email: "email",
  idType: "idType",
  idNumber: "idNumber",
  gender: "gender",
  businessName: "businessName",
  province: "province",
  district: "district",
  street: "street",
  notes: "notes",
  tinNumber: "tinNumber",
  ward: "ward",
  houseNumber: "houseNumber",
  country: "country",
  issuedPlace: "issuedPlace",
  channelParentType: "channelParentType",
  channelParentName: "channelParentName",
  channelManagerType: "channelManagerType",
  channelManagerName: "channelManagerName",
  channelType: "channelType",
}

function parseDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

async function resolveLookupId(table: "channel" | "businessSector", value?: string) {
  if (!value) return null
  const prisma = getPrisma()
  if (LOOKUP_UUID.test(value)) {
    const found =
      table === "channel"
        ? await prisma.channel.findUnique({ where: { id: value }, select: { id: true } })
        : await prisma.businessSector.findUnique({ where: { id: value }, select: { id: true } })
    if (found) return found.id
  }
  if (table === "channel") {
    const found = await prisma.channel.findFirst({
      where: { OR: [{ name: value }, { code: value }] },
      select: { id: true },
    })
    return found?.id ?? null
  }
  const found = await prisma.businessSector.findFirst({
    where: { OR: [{ name: value }, { code: value }] },
    select: { id: true },
  })
  return found?.id ?? null
}

export async function saveDraft(patch: Record<string, unknown>) {
  const parsed = applicationDraftSchema.parse(patch)
  const { profile } = await requireAgent()
  const prisma = getPrisma()
  const agent = await prisma.agent.findUnique({ where: { userId: profile.id } })
  if (!agent) throw new BackendError("APPLICATION", "Agent profile is missing")
  assertAgentWritable(agent.status)

  const existing = await prisma.application.findFirst({
    where: { agentId: agent.id, deletedAt: null, status: { in: ["DRAFT", "NEEDS_CORRECTION"] } },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  })

  const appId =
    existing?.id ??
    (await withDbGuards(async (tx) => {
      const inReview = await tx.application.findFirst({
        where: {
          agentId: agent.id,
          deletedAt: null,
          status: { in: ["SUBMITTED", "PENDING_REVIEW", "IN_PROGRESS"] },
        },
        select: { id: true },
      })
      if (inReview) {
        throw new BackendError(
          "APPLICATION",
          "You already have an application in review. Open that application instead of starting a new one.",
        )
      }

      const created = await tx.application.create({
        data: {
          agentId: agent.id,
          status: "DRAFT",
          agentName: profile.fullName,
          email: profile.email,
          phone: profile.phone,
        },
      })
      await tx.statusHistory.create({
        data: {
          applicationId: created.id,
          newStatus: "DRAFT",
          changedById: profile.id,
          note: "Draft created",
        },
      })
      const types = await tx.documentType.findMany({ where: { code: { not: "deposit_proof" } } })
      if (types.length) {
        await tx.document.createMany({
          data: types.map((type) => ({
            applicationId: created.id,
            documentType: type.code,
            status: "missing",
          })),
        })
      }
      await tx.depositRecord.create({ data: { applicationId: created.id, status: "PENDING" } })
      return created.id
    }))

  const data: Prisma.ApplicationUncheckedUpdateInput = {}
  for (const [key, value] of Object.entries(parsed)) {
    const column = DRAFT_COLUMNS[key]
    if (column) (data as Record<string, unknown>)[column] = value
  }
  data.phone = profile.phone
  data.businessName = profile.fullName
  data.channelParentType = CHANNEL_PARENT_TYPE
  data.channelParentName = CHANNEL_PARENT_NAME
  data.channelManagerName = CHANNEL_MANAGER_NAME
  data.channelType = CHANNEL_TIER
  if (parsed.channelManagerType !== undefined) {
    data.channelManagerType = isChannelManagerType(parsed.channelManagerType) ? parsed.channelManagerType : ""
  }
  if (parsed.idType !== undefined) {
    data.idType = isAllowedIdType(parsed.idType) ? parsed.idType : ""
  }
  const [channelId, sectorId] = await Promise.all([
    parsed.channel ? resolveLookupId("channel", parsed.channel) : Promise.resolve(null),
    parsed.sector ? resolveLookupId("businessSector", parsed.sector) : Promise.resolve(null),
  ])
  if (channelId) data.channelId = channelId
  if (sectorId) data.sectorId = sectorId
  if (parsed.issuedDate !== undefined) {
    data.issuedDate = parsed.issuedDate ? parseDateOnly(parsed.issuedDate) : null
  }
  if (parsed.expireDate !== undefined) {
    data.expireDate = parsed.expireDate ? parseDateOnly(parsed.expireDate) : null
  }
  if (parsed.lat != null && parsed.lng != null) {
    data.lat = parsed.lat
    data.lng = parsed.lng
    data.locationCapturedAt = new Date()
    if (parsed.locationAccuracy != null) data.locationAccuracy = parsed.locationAccuracy
  }

  const current = await prisma.application.findUnique({
    where: { id: appId },
    select: {
      agentName: true,
      phone: true,
      email: true,
      idType: true,
      idNumber: true,
      issuedPlace: true,
      issuedDate: true,
      expireDate: true,
      gender: true,
      businessName: true,
      channelId: true,
      sectorId: true,
      country: true,
      province: true,
      district: true,
      ward: true,
      street: true,
      houseNumber: true,
    },
  })
  const counts = countCompleteFields({
    agent_name: (data.agentName as string | undefined) ?? current?.agentName,
    phone: (data.phone as string | undefined) ?? current?.phone,
    email: (data.email as string | undefined) ?? current?.email,
    id_type: (data.idType as string | undefined) ?? current?.idType,
    id_number: (data.idNumber as string | undefined) ?? current?.idNumber,
    issued_place: (data.issuedPlace as string | undefined) ?? current?.issuedPlace,
    issued_date: data.issuedDate !== undefined ? data.issuedDate : current?.issuedDate,
    expire_date: data.expireDate !== undefined ? data.expireDate : current?.expireDate,
    gender: (data.gender as string | undefined) ?? current?.gender,
    business_name: (data.businessName as string | undefined) ?? current?.businessName,
    channel_id: (data.channelId as string | undefined) ?? current?.channelId,
    sector_id: (data.sectorId as string | undefined) ?? current?.sectorId,
    country: (data.country as string | undefined) ?? current?.country,
    province: (data.province as string | undefined) ?? current?.province,
    district: (data.district as string | undefined) ?? current?.district,
    ward: (data.ward as string | undefined) ?? current?.ward,
    street: (data.street as string | undefined) ?? current?.street,
    house_number: (data.houseNumber as string | undefined) ?? current?.houseNumber,
  })
  data.fieldsComplete = counts.fieldsComplete
  data.fieldsTotal = counts.fieldsTotal

  await prisma.application.update({ where: { id: appId }, data })

  return getApplication(appId)
}

async function seedDevelopmentSubmission(applicationId: string, profile: { fullName: string; email: string; phone: string | null }) {
  if (process.env.NODE_ENV !== "development") return
  const prisma = getPrisma()
  const [channel, sector, types, current] = await Promise.all([
    prisma.channel.findFirst({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.businessSector.findFirst({
      where: { active: true, NOT: { code: "all" } },
      orderBy: { name: "asc" },
    }),
    prisma.documentType.findMany(),
    prisma.application.findUnique({ where: { id: applicationId } }),
  ])
  if (!current) return

  const agentName = current.agentName || profile.fullName || "Dev Test Agent"
  const phone = current.phone || profile.phone || "+255712345678"
  const email = current.email || profile.email
  const idType = isAllowedIdType(current.idType) ? current.idType : "National ID (NIDA)"
  const idNumber = current.idNumber || "19850512-11101-00001-26"
  const issuedPlace = current.issuedPlace || "Dar es Salaam"
  const issuedDate = current.issuedDate ?? new Date("2020-01-15T00:00:00.000Z")
  const expireDate = current.expireDate ?? new Date("2030-01-15T00:00:00.000Z")
  const gender = current.gender || "Male"
  const country = current.country || "Tanzania"
  const province = current.province || "Dar es Salaam"
  const district = current.district || "Kinondoni"
  const ward = current.ward || "Oyster Bay"
  const street = current.street || "Toure Drive"
  const houseNumber = current.houseNumber || "Plot 45"
  const channelId = current.channelId ?? channel?.id ?? null
  const sectorId = current.sectorId ?? sector?.id ?? null
  const counts = countCompleteFields({
    agent_name: agentName,
    phone,
    email,
    id_type: idType,
    id_number: idNumber,
    issued_place: issuedPlace,
    issued_date: issuedDate,
    expire_date: expireDate,
    gender,
    business_name: agentName,
    channel_id: channelId,
    sector_id: sectorId,
    country,
    province,
    district,
    ward,
    street,
    house_number: houseNumber,
  })

  await prisma.application.update({
    where: { id: applicationId },
    data: {
      agentName,
      phone,
      email,
      businessName: current.businessName || agentName,
      idType,
      idNumber,
      issuedPlace,
      issuedDate,
      expireDate,
      gender,
      country,
      province,
      district,
      ward,
      street,
      houseNumber,
      tinNumber: current.tinNumber || "100-000-000",
      channelParentType: CHANNEL_PARENT_TYPE,
      channelParentName: CHANNEL_PARENT_NAME,
      channelManagerType: isChannelManagerType(current.channelManagerType)
        ? current.channelManagerType
        : "Super Agent",
      channelManagerName: CHANNEL_MANAGER_NAME,
      channelType: CHANNEL_TIER,
      channelId,
      sectorId,
      lat: current.lat ?? -6.7785,
      lng: current.lng ?? 39.2743,
      locationAccuracy: current.locationAccuracy ?? 15,
      locationCapturedAt: current.locationCapturedAt ?? new Date(),
      fieldsComplete: counts.fieldsComplete,
      fieldsTotal: counts.fieldsTotal,
    },
  })

  const existing = await prisma.document.findMany({
    where: { applicationId, deletedAt: null },
  })
  const byType = new Map(existing.map((row) => [row.documentType, row]))
  const now = new Date()
  const toCreate: Prisma.DocumentCreateManyInput[] = []
  const toUpdate: string[] = []

  for (const type of types) {
    const isPdf = type.code === "tin" || type.code === "contract" || type.code === "licence" || type.code === "other"
    const row = byType.get(type.code)
    if (!row) {
      toCreate.push({
        applicationId,
        documentType: type.code,
        status: "unverified",
        originalName: `dev-${type.code}.${isPdf ? "pdf" : "png"}`,
        mimeType: isPdf ? "application/pdf" : "image/png",
        fileExtension: isPdf ? "pdf" : "png",
        fileSize: BigInt(2048),
        uploadedAt: now,
        storageKey: `dev-placeholder/${applicationId}/${type.code}`,
      })
      continue
    }
    if (row.status === "missing" || row.status === "rejected" || !row.uploadedAt) {
      toUpdate.push(row.id)
    }
  }

  await Promise.all([
    toCreate.length ? prisma.document.createMany({ data: toCreate }) : Promise.resolve(),
    toUpdate.length
      ? prisma.document.updateMany({
          where: { id: { in: toUpdate } },
          data: {
            status: "unverified",
            uploadedAt: now,
            originalName: "dev-placeholder.png",
            mimeType: "image/png",
            fileExtension: "png",
            fileSize: BigInt(2048),
            storageKey: `dev-placeholder/${applicationId}/file`,
            rejectionReason: null,
          },
        })
      : Promise.resolve(),
  ])

  const proof = await prisma.document.findFirst({
    where: { applicationId, documentType: "deposit_proof", deletedAt: null },
    select: { id: true },
  })
  await prisma.depositRecord.upsert({
    where: { applicationId },
    create: {
      applicationId,
      status: "SUBMITTED",
      reference: "DEV-TEST-MPESA",
      proofDocumentId: proof?.id,
    },
    update: {
      status: "SUBMITTED",
      reference: "DEV-TEST-MPESA",
      proofDocumentId: proof?.id,
    },
  })
}

export async function submitApplication(applicationId?: string, options?: { fillTestData?: boolean }) {
  const { profile } = await requireAgent()
  const prisma = getPrisma()
  const agent = await prisma.agent.findUnique({ where: { userId: profile.id } })
  if (!agent) throw new BackendError("APPLICATION", "Agent profile is missing")
  assertAgentWritable(agent.status)

  let id = applicationId
  if (!id) {
    const draft = await prisma.application.findFirst({
      where: { agentId: agent.id, deletedAt: null, status: { in: ["DRAFT", "NEEDS_CORRECTION"] } },
    })
    if (!draft) throw new BackendError("APPLICATION", "No draft application to submit")
    id = draft.id
  }

  if (process.env.NODE_ENV === "development" && options?.fillTestData) {
    await seedDevelopmentSubmission(id, profile)
  }

  const current = await prisma.application.findUnique({
    where: { id },
    include: { documents: { include: { type: true } }, deposit: true },
  })
  if (!current) throw new BackendError("APPLICATION", "No application to submit")
  if (current.agentId !== agent.id) throw new NotFoundError("Application not found")
  if (current.status !== "DRAFT" && current.status !== "NEEDS_CORRECTION") {
    throw new BackendError("APPLICATION", `Application cannot be submitted from status ${current.status}`)
  }

  const skipCompleteness = process.env.NODE_ENV === "development" && Boolean(options?.fillTestData)
  if (!skipCompleteness) {
    const missing = current.documents.filter(
      (doc) => doc.type.required && (doc.status === "missing" || doc.status === "rejected"),
    )
    if (missing.length) throw new BackendError("APPLICATION", "Required documents are missing or rejected")
    const depositProof = current.documents.find(
      (doc) => doc.documentType === "deposit_proof" && (doc.status === "unverified" || doc.status === "verified"),
    )
    if (!current.deposit?.reference?.trim() || !depositProof) {
      throw new BackendError("APPLICATION", "Deposit reference and proof are required before submission")
    }
    if (current.lat == null || current.lng == null) {
      throw new BackendError("APPLICATION", "Live location is required before submission")
    }
    if (
      !current.agentName ||
      !current.phone ||
      !current.email ||
      !current.idType ||
      !current.idNumber ||
      !current.issuedPlace ||
      !current.issuedDate ||
      !current.expireDate ||
      !current.gender ||
      !current.channelId ||
      !current.sectorId ||
      !current.channelManagerType ||
      !current.province ||
      !current.district ||
      !current.ward ||
      !current.street ||
      !current.houseNumber
    ) {
      throw new BackendError("APPLICATION", "Required application fields are incomplete")
    }
  }

  const duplicates = await prisma.application.findMany({
    where: { deletedAt: null, status: { not: "REJECTED" }, id: { not: id } },
    select: { id: true, phone: true, idNumber: true, tinNumber: true, applicationNumber: true },
  })
  const warnings = duplicates
    .filter(
      (row) =>
        (current.phone && row.phone === current.phone) ||
        (current.idNumber && row.idNumber === current.idNumber) ||
        (current.tinNumber && row.tinNumber === current.tinNumber),
    )
    .map((row) => row.applicationNumber ?? row.id)

  await withDbGuards(async (tx) => {
    if (!current.applicationNumber) {
      try {
        const number = await tx.$queryRaw<Array<{ next_application_number: string }>>`
          SELECT public.next_application_number() AS next_application_number
        `
        if (number[0]?.next_application_number) {
          await tx.application.update({
            where: { id },
            data: { applicationNumber: number[0].next_application_number },
          })
        }
      } catch {
        // numbering function not applied yet
      }
    }
    if (!agent.agentCode) {
      try {
        const code = await tx.$queryRaw<Array<{ next_agent_code: string }>>`
          SELECT public.next_agent_code() AS next_agent_code
        `
        if (code[0]?.next_agent_code) {
          await tx.agent.update({ where: { id: agent.id }, data: { agentCode: code[0].next_agent_code } })
        }
      } catch {
        // numbering function not applied yet
      }
    }

    const refreshed = await tx.application.findUnique({ where: { id }, select: { submittedAt: true } })
    await tx.application.update({
      where: { id },
      data: {
        status: "PENDING_REVIEW",
        submittedAt: refreshed?.submittedAt ?? new Date(),
      },
    })
    await tx.statusHistory.createMany({
      data: [
        {
          applicationId: id,
          oldStatus: current.status,
          newStatus: "SUBMITTED",
          changedById: profile.id,
          note: "Application submitted",
        },
        {
          applicationId: id,
          oldStatus: "SUBMITTED",
          newStatus: "PENDING_REVIEW",
          changedById: profile.id,
          note: "Queued for review",
        },
      ],
    })
    await tx.correctionRequest.updateMany({
      where: { applicationId: id, resolvedAt: null },
      data: { resolvedAt: new Date() },
    })
  })

  await emitNotification({
    userId: profile.id,
    category: "application",
    title: "Application submitted",
    message: "Your application is pending review.",
    entityType: "application",
    entityId: id,
  })
  await writeAudit({
    actorId: profile.id,
    actorRole: profile.role,
    category: "Application",
    action: "Submitted application",
    detail: current.applicationNumber ?? id,
    entityType: "application",
    entityId: id,
    target: current.applicationNumber ?? id,
    ipAddress: await clientIp(),
  })

  return { application: await getApplication(id), duplicateWarnings: warnings }
}

export async function updateStatus(
  applicationId: string,
  status: AppStatus,
  note?: string,
  options?: { notify?: boolean },
) {
  const next = appStatusSchema.parse(status)
  const { profile } = await requireAdmin()
  const { row } = await loadApplicationBundle(applicationId)
  assertAdminTransition(row.status, next)

  if (status === "REJECTED" && !note) throw new BackendError("APPLICATION", "A rejection reason is required")

  await withDbGuards(async (tx) => {
    await tx.application.update({
      where: { id: applicationId },
      data: {
        status: next,
        rejectionReason: status === "REJECTED" ? note : undefined,
        completedAt: status === "COMPLETED" ? new Date() : undefined,
        reviewedAt: status === "IN_PROGRESS" && !row.reviewedAt ? new Date() : row.reviewedAt,
      },
    })
    await tx.statusHistory.create({
      data: {
        applicationId,
        oldStatus: row.status,
        newStatus: next,
        changedById: profile.id,
        note: note ?? `Status changed to ${status}`,
      },
    })
    if (next === "COMPLETED") {
      const owner = await tx.agent.findUnique({ where: { id: row.agentId }, select: { status: true } })
      await tx.agent.update({
        where: { id: row.agentId },
        data: {
          verified: true,
          ...(owner?.status === "suspended" ? {} : { status: "active" as const }),
        },
      })
    }
  })

  const notify = options?.notify !== false
  const agent = notify ? await getPrisma().agent.findUnique({ where: { id: row.agentId } }) : null
  if (agent) {
    const email =
      next === "REJECTED" || next === "COMPLETED" || next === "NEEDS_CORRECTION"
    const title =
      next === "REJECTED"
        ? "Application rejected"
        : next === "COMPLETED"
          ? "Application completed"
          : next === "NEEDS_CORRECTION"
            ? "Correction requested"
            : "Application status updated"
    await emitNotification({
      userId: agent.userId,
      category: "application",
      title,
      message: note || `Your application is now ${status.replaceAll("_", " ").toLowerCase()}.`,
      entityType: "application",
      entityId: applicationId,
      email,
    })
  }
  await writeAudit({
    actorId: profile.id,
    actorRole: profile.role,
    category: "Application",
    action: "Updated status",
    detail: note || `Status changed to ${status}`,
    entityType: "application",
    entityId: applicationId,
    target: row.applicationNumber ?? applicationId,
    ipAddress: await clientIp(),
  })
  return getApplication(applicationId)
}

export async function requestCorrection(
  applicationId: string,
  summary: string,
  items: { kind: "field" | "document"; target: string; reason: string }[],
) {
  const parsed = correctionRequestSchema.parse({ applicationId, summary, items })
  const { profile } = await requireAdmin()
  const { row } = await loadApplicationBundle(parsed.applicationId)

  const request = await getPrisma().correctionRequest.create({
    data: {
      applicationId: parsed.applicationId,
      requestedById: profile.id,
      summary: parsed.summary,
      items: parsed.items.length
        ? {
            create: parsed.items.map((item) => ({
              kind: item.kind,
              target: item.target,
              reason: item.reason,
            })),
          }
        : undefined,
    },
  })

  if (row.status !== "NEEDS_CORRECTION") {
    await updateStatus(parsed.applicationId, "NEEDS_CORRECTION", parsed.summary, { notify: false })
  }
  const agent = await getPrisma().agent.findUnique({ where: { id: row.agentId } })
  if (agent) {
    await emitNotification({
      userId: agent.userId,
      category: "application",
      title: "Correction requested",
      message: parsed.summary,
      entityType: "application",
      entityId: parsed.applicationId,
      email: true,
    })
  }
  return request.id
}

export async function findDuplicates(input: {
  phone?: string
  idNumber?: string
  tinNumber?: string
  excludeId?: string
}) {
  await requireAdmin()
  const phone = input.phone?.trim() || ""
  const idNumber = input.idNumber?.trim() || ""
  const tinNumber = input.tinNumber?.trim() || ""
  if (!phone && !idNumber && !tinNumber) return []

  const rows = await getPrisma().application.findMany({
    where: {
      deletedAt: null,
      status: { notIn: ["REJECTED", "DRAFT"] },
    },
    select: { id: true, applicationNumber: true, phone: true, idNumber: true, tinNumber: true, status: true },
  })
  return rows.flatMap((row) => {
    if (input.excludeId && row.id === input.excludeId) return []
    const matches: Array<"phone" | "id" | "tin"> = []
    if (phone && row.phone === phone) matches.push("phone")
    if (idNumber && row.idNumber === idNumber) matches.push("id")
    if (tinNumber && row.tinNumber === tinNumber) matches.push("tin")
    if (!matches.length) return []
    return [
      {
        id: row.id,
        appNumber: row.applicationNumber ?? "DRAFT",
        status: row.status,
        matches,
      },
    ]
  })
}
