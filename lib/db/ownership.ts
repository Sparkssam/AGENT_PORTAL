import { ForbiddenError, NotFoundError } from "@/lib/backend/errors"

export function isStaffRole(role: string) {
  return role === "admin" || role === "super_admin"
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
