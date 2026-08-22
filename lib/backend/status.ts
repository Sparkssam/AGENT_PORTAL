import { ForbiddenError } from "@/lib/backend/errors"
import { isFinalApprover } from "@/lib/db/ownership"
import type { AppStatus } from "@/lib/admin-data"

export const ADMIN_REVIEW_STATUSES: AppStatus[] = [
  "PENDING_REVIEW",
  "IN_PROGRESS",
  "NEEDS_CORRECTION",
  "COMPLETED",
  "REJECTED",
]

/** Reviewers move work through the queue. Final approvers may also verify or reject the case. */
export const ALLOWED_REVIEWER_TRANSITIONS: Record<AppStatus, AppStatus[]> = {
  DRAFT: [],
  SUBMITTED: ["PENDING_REVIEW"],
  PENDING_REVIEW: ["IN_PROGRESS", "NEEDS_CORRECTION"],
  IN_PROGRESS: ["NEEDS_CORRECTION", "PENDING_REVIEW"],
  NEEDS_CORRECTION: [],
  COMPLETED: [],
  REJECTED: [],
}

export const ALLOWED_APPROVER_TRANSITIONS: Record<AppStatus, AppStatus[]> = {
  DRAFT: [],
  SUBMITTED: ["PENDING_REVIEW"],
  PENDING_REVIEW: ["IN_PROGRESS", "NEEDS_CORRECTION", "COMPLETED", "REJECTED"],
  IN_PROGRESS: ["NEEDS_CORRECTION", "COMPLETED", "REJECTED", "PENDING_REVIEW"],
  NEEDS_CORRECTION: [],
  COMPLETED: [],
  REJECTED: [],
}

/** Admin may move a case along this graph. Agents use submitApplication instead. */
export const ALLOWED_ADMIN_TRANSITIONS = ALLOWED_APPROVER_TRANSITIONS

export const EDITABLE_STATUSES: AppStatus[] = ["DRAFT", "NEEDS_CORRECTION"]
export const IN_REVIEW_STATUSES: AppStatus[] = ["SUBMITTED", "PENDING_REVIEW", "IN_PROGRESS"]
export const CLOSED_STATUSES: AppStatus[] = ["COMPLETED", "REJECTED"]
export const FINAL_DECISIONS: AppStatus[] = ["COMPLETED", "REJECTED"]

export function transitionsForRole(role: string): Record<AppStatus, AppStatus[]> {
  return isFinalApprover(role) ? ALLOWED_APPROVER_TRANSITIONS : ALLOWED_REVIEWER_TRANSITIONS
}

export function assertAdminTransition(from: AppStatus, to: AppStatus, role?: string) {
  const allowed = role ? transitionsForRole(role) : ALLOWED_APPROVER_TRANSITIONS
  if (!allowed[from].includes(to)) {
    if (FINAL_DECISIONS.includes(to) && role && !isFinalApprover(role)) {
      throw new ForbiddenError(
        "Only a final approver can verify or reject an application. Request a correction, or ask a super administrator to finish the case.",
      )
    }
    throw new Error(`Cannot change status from ${from} to ${to}`)
  }
}

export function isEditableStatus(status?: AppStatus | null) {
  return Boolean(status && EDITABLE_STATUSES.includes(status))
}

export function isInReviewStatus(status?: AppStatus | null) {
  return Boolean(status && IN_REVIEW_STATUSES.includes(status))
}

export function isClosedStatus(status?: AppStatus | null) {
  return Boolean(status && CLOSED_STATUSES.includes(status))
}

export function canAgentChangeDocument(status: AppStatus | undefined, required: boolean) {
  if (!status || isEditableStatus(status)) return true
  if (isClosedStatus(status)) return false
  return !required
}

const COUNTED_FIELDS = [
  "agent_name",
  "phone",
  "email",
  "id_type",
  "id_number",
  "issued_place",
  "issued_date",
  "expire_date",
  "gender",
  "business_name",
  "channel_id",
  "sector_id",
  "country",
  "province",
  "district",
  "ward",
  "street",
  "house_number",
] as const

export function countCompleteFields(row: Record<string, unknown>) {
  const complete = COUNTED_FIELDS.filter((key) => {
    const value = row[key]
    return value !== null && value !== undefined && String(value).trim() !== ""
  }).length
  return { fieldsComplete: complete, fieldsTotal: COUNTED_FIELDS.length }
}
