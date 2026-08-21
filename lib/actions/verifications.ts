"use server"

import { requireAdmin, requireAgent, getAuthContext } from "@/lib/backend/session"
import { NotFoundError } from "@/lib/backend/errors"
import type { ExtractedIdFields } from "@/lib/verification"
import {
  findFlaggedVerifications,
  findLatestVerification,
  findVerificationsForUser,
  updateVerificationReview,
  type StoredVerification,
} from "@/lib/db/verification-store"

export type ClientVerification = {
  id: string
  documentId: string
  applicationId: string
  documentType: string
  passed: boolean
  issues: string[]
  extracted: ExtractedIdFields
  confidence: number
  provider: string | null
  reviewStatus: StoredVerification["reviewStatus"]
  createdAt: string
  reviewedAt: string | null
  documentName?: string
  agentName?: string
  agentEmail?: string | null
}

function serializeVerification(row: StoredVerification): ClientVerification {
  return {
    id: row.id,
    documentId: row.documentId,
    applicationId: row.applicationId,
    documentType: row.documentType,
    passed: row.passed,
    issues: row.issues,
    extracted: row.extracted,
    confidence: row.confidence,
    provider: row.provider,
    reviewStatus: row.reviewStatus,
    createdAt: row.createdAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    documentName: row.documentName,
    agentName: row.agentName,
    agentEmail: row.agentEmail,
  }
}

export async function listMyVerifications() {
  const { profile } = await requireAgent()
  return (await findVerificationsForUser(profile.id)).map(serializeVerification)
}

export async function listFlaggedVerifications() {
  await requireAdmin()
  return (await findFlaggedVerifications()).map(serializeVerification)
}

export async function setVerificationReview(id: string, reviewStatus: StoredVerification["reviewStatus"]) {
  const { profile } = await requireAdmin()
  const updated = await updateVerificationReview(id, reviewStatus, profile.id)
  if (!updated) throw new NotFoundError("Verification not found")
  return serializeVerification(updated)
}

export async function getLatestVerification(documentId: string) {
  const { profile } = await getAuthContext()
  const isAdmin = profile.role === "admin" || profile.role === "super_admin"
  const row = await findLatestVerification(documentId, isAdmin ? undefined : profile.id)
  return row ? serializeVerification(row) : null
}
