import { ForbiddenError, NotFoundError } from "@/lib/backend/errors"

export function isStaffRole(role: string) {
  return role === "admin" || role === "super_admin"
}

/** Super administrators are the only staff who may verify or reject a whole application. */
export function isFinalApprover(role: string) {
  return role === "super_admin"
}

export function staffDutyFor(role: string): "reviewer" | "approver" | undefined {
  if (role === "super_admin") return "approver"
  if (role === "admin") return "reviewer"
  return undefined
}

export function staffTitleFor(role: string) {
  if (role === "super_admin") return "Final approver"
  if (role === "admin") return "Reviewer"
  return "Registered Agent"
}

export function assertAgentWritable(status: string | null | undefined) {
  if (status === "suspended") {
    throw new ForbiddenError(
      "This agent account is suspended. Applications and documents cannot be changed until an administrator reactivates it.",
    )
  }
}

export function agentOwnsApplication(agentId: string | null | undefined, applicationAgentId: string) {
  return Boolean(agentId && agentId === applicationAgentId)
}

/** Agents may only see their own case. Staff skip this check. */
export function assertAgentOwnsApplication(agentId: string | null | undefined, applicationAgentId: string) {
  if (!agentOwnsApplication(agentId, applicationAgentId)) {
    throw new NotFoundError("Application not found")
  }
}
