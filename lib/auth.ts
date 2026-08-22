export type UserRole = "admin" | "agent"
export type StaffDuty = "reviewer" | "approver"

export interface SessionUser {
  id?: string
  role: UserRole
  name: string
  email: string
  title: string
  initials: string
  staffDuty?: StaffDuty
  canFinalize?: boolean
}

const SESSION_KEY = "kinetic.session"
export const SESSION_EVENT = "kinetic-session-change"

export function clearSession() {
  if (typeof window === "undefined") return
  window.sessionStorage.removeItem(SESSION_KEY)
  window.dispatchEvent(new Event(SESSION_EVENT))
}

export function dashboardPathFor(role: UserRole | "super_admin") {
  return role === "agent" ? "/agent" : "/admin/dashboard"
}
