import { Prisma } from "@prisma/client"
import { getPrisma } from "@/lib/prisma"
import type { ExtractedIdFields } from "@/lib/verification"

export type StoredVerification = {
  id: string
  documentId: string
  userId: string
  applicationId: string
  documentType: string
  passed: boolean
  issues: string[]
  extracted: ExtractedIdFields
  quality: Prisma.JsonValue
  confidence: number
  provider: string | null
  authenticity: Prisma.JsonValue
  reviewStatus: "pending" | "flagged" | "approved" | "dismissed"
  reviewedById: string | null
  reviewedAt: Date | null
  createdAt: Date
  documentName?: string
  agentName?: string
  agentEmail?: string | null
}

type VerificationRow = {
  id: string
  document_id: string
  user_id: string
  application_id: string
  document_type: string
  passed: boolean
  issues: string[] | null
  extracted: ExtractedIdFields | string | null
  quality: Prisma.JsonValue
  confidence: string | number | null
  provider: string | null
  authenticity: Prisma.JsonValue
  review_status: StoredVerification["reviewStatus"]
  reviewed_by: string | null
  reviewed_at: Date | string | null
  created_at: Date | string
  document_name?: string | null
  full_name?: string | null
  email?: string | null
}

function asObject(value: unknown): ExtractedIdFields {
  if (!value) return {}
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as ExtractedIdFields
    } catch {
      return {}
    }
  }
  if (typeof value === "object" && !Array.isArray(value)) return value as ExtractedIdFields
  return {}
}

function mapRow(row: VerificationRow): StoredVerification {
  return {
    id: row.id,
    documentId: row.document_id,
    userId: row.user_id,
    applicationId: row.application_id,
    documentType: row.document_type,
    passed: row.passed,
    issues: row.issues ?? [],
    extracted: asObject(row.extracted),
    quality: row.quality,
    confidence: Number(row.confidence ?? 0),
    provider: row.provider,
    authenticity: row.authenticity,
    reviewStatus: row.review_status,
    reviewedById: row.reviewed_by,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : null,
    createdAt: new Date(row.created_at),
    documentName: row.document_name ?? undefined,
    agentName: row.full_name ?? undefined,
    agentEmail: row.email,
  }
}

export async function insertDocumentVerification(input: {
  documentId: string
  userId: string
  applicationId: string
  documentType: string
  passed: boolean
  issues: string[]
  extracted: object
  quality: object
  confidence: number
  provider: string | null
  authenticity: object
  reviewStatus: StoredVerification["reviewStatus"]
}) {
  const issuesSql = input.issues.length
    ? Prisma.sql`ARRAY[${Prisma.join(input.issues)}]::text[]`
    : Prisma.sql`'{}'::text[]`
  await getPrisma().$executeRaw(Prisma.sql`
    insert into public.document_verifications (
      document_id, user_id, application_id, document_type, passed, issues,
      extracted, quality, confidence, provider, authenticity, review_status
    ) values (
      ${input.documentId}::uuid,
      ${input.userId}::uuid,
      ${input.applicationId}::uuid,
      ${input.documentType},
      ${input.passed},
      ${issuesSql},
      ${JSON.stringify(input.extracted)}::jsonb,
      ${JSON.stringify(input.quality)}::jsonb,
      ${input.confidence},
      ${input.provider},
      ${JSON.stringify(input.authenticity)}::jsonb,
      ${input.reviewStatus}::public.verification_review_status
    )
  `)
}

export async function findLatestVerifications(documentIds: string[]) {
  const latest = new Map<string, StoredVerification>()
  if (!documentIds.length) return latest
  const rows = await getPrisma().$queryRaw<VerificationRow[]>(Prisma.sql`
    select distinct on (document_id)
      id, document_id, user_id, application_id, document_type, passed, issues,
      extracted, quality, confidence, provider, authenticity, review_status,
      reviewed_by, reviewed_at, created_at
    from public.document_verifications
    where document_id in (${Prisma.join(documentIds.map((id) => Prisma.sql`${id}::uuid`))})
    order by document_id, created_at desc
  `)
  for (const row of rows) {
    latest.set(row.document_id, mapRow(row))
  }
  return latest
}

export async function findVerificationsForUser(userId: string) {
  const rows = await getPrisma().$queryRaw<VerificationRow[]>(Prisma.sql`
    select id, document_id, user_id, application_id, document_type, passed, issues,
      extracted, quality, confidence, provider, authenticity, review_status,
      reviewed_by, reviewed_at, created_at
    from public.document_verifications
    where user_id = ${userId}::uuid
    order by created_at desc
    limit 50
  `)
  return rows.map(mapRow)
}

export async function findFlaggedVerifications() {
  const rows = await getPrisma().$queryRaw<VerificationRow[]>(Prisma.sql`
    select
      v.id, v.document_id, v.user_id, v.application_id, v.document_type, v.passed, v.issues,
      v.extracted, v.quality, v.confidence, v.provider, v.authenticity, v.review_status,
      v.reviewed_by, v.reviewed_at, v.created_at,
      coalesce(t.name, v.document_type) as document_name,
      p.full_name, p.email
    from public.document_verifications v
    join public.profiles p on p.id = v.user_id
    left join public.document_types t on t.code = v.document_type
    where v.review_status = 'flagged'
    order by v.created_at desc
    limit 100
  `)
  return rows.map(mapRow)
}

export async function findLatestVerification(documentId: string, userId?: string) {
  const rows = await getPrisma().$queryRaw<VerificationRow[]>(
    userId
      ? Prisma.sql`
          select id, document_id, user_id, application_id, document_type, passed, issues,
            extracted, quality, confidence, provider, authenticity, review_status,
            reviewed_by, reviewed_at, created_at
          from public.document_verifications
          where document_id = ${documentId}::uuid and user_id = ${userId}::uuid
          order by created_at desc
          limit 1
        `
      : Prisma.sql`
          select id, document_id, user_id, application_id, document_type, passed, issues,
            extracted, quality, confidence, provider, authenticity, review_status,
            reviewed_by, reviewed_at, created_at
          from public.document_verifications
          where document_id = ${documentId}::uuid
          order by created_at desc
          limit 1
        `,
  )
  return rows[0] ? mapRow(rows[0]) : null
}

export async function updateVerificationReview(
  id: string,
  reviewStatus: StoredVerification["reviewStatus"],
  reviewedById: string,
) {
  const rows = await getPrisma().$queryRaw<VerificationRow[]>(Prisma.sql`
    update public.document_verifications
    set review_status = ${reviewStatus}::public.verification_review_status,
        reviewed_by = ${reviewedById}::uuid,
        reviewed_at = timezone('utc', now())
    where id = ${id}::uuid
    returning id, document_id, user_id, application_id, document_type, passed, issues,
      extracted, quality, confidence, provider, authenticity, review_status,
      reviewed_by, reviewed_at, created_at
  `)
  return rows[0] ? mapRow(rows[0]) : null
}
