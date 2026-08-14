// Lightweight demo-only auth layer for the Kinetic Agent Portal.
// There is no backend yet, so "sessions" are just a small JSON blob kept in
// sessionStorage (cleared when the browser tab closes) — enough to support
// logging in as one of two demo roles, guarding routes, and logging out.

export type UserRole = "admin" | "agent"

export interface SessionUser {
  role: UserRole
  name: string
  email: string
  title: string
  initials: string
}

interface DemoAccount {
  password: string
  user: SessionUser
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    password: "Admin@123",
    user: {
      role: "admin",
      name: "Admin User",
      email: "admin@kinetic.co.tz",
      title: "Super Administrator",
      initials: "AU",
    },
  },
  {
    password: "Agent@123",
    user: {
      role: "agent",
      name: "Amina Joseph Mwakalinga",
      email: "amina.mwakalinga@kinetic.co.tz",
      title: "Registered Agent",
      initials: "AM",
    },
  },
]

const SESSION_KEY = "kinetic.session"
export const SESSION_EVENT = "kinetic-session-change"

export function findAccount(email: string, password: string): SessionUser | null {
  const normalized = email.trim().toLowerCase()
  const match = DEMO_ACCOUNTS.find(
    (account) => account.user.email.toLowerCase() === normalized && account.password === password,
  )
  return match ? match.user : null
}

export function readSession(): SessionUser | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as SessionUser) : null
  } catch {
    return null
  }
}

export function writeSession(user: SessionUser) {
  if (typeof window === "undefined") return
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
  window.dispatchEvent(new Event(SESSION_EVENT))
}

export function clearSession() {
  if (typeof window === "undefined") return
  window.sessionStorage.removeItem(SESSION_KEY)
  window.dispatchEvent(new Event(SESSION_EVENT))
}

export function dashboardPathFor(role: UserRole) {
  return role === "admin" ? "/admin/dashboard" : "/agent/dashboard"
}
