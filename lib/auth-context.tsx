"use client"

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { clearSession, type SessionUser, type StaffDuty, type UserRole } from "@/lib/auth"
import { getSession, signIn as supabaseSignIn, signOut as supabaseSignOut, signUp as supabaseSignUp } from "@/lib/actions/auth"
import { createClient } from "@/lib/supabase/client"

interface AuthContextValue {
  user: SessionUser | null
  loading: boolean
  backendEnabled: boolean
  login: (email: string, password: string) => Promise<SessionUser | null>
  register: (input: { fullName: string; email: string; phone: string; password: string }) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function initialsFrom(name: string, email: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  if (parts[0]) return parts[0].slice(0, 2).toUpperCase()
  return email.slice(0, 2).toUpperCase() || "AG"
}

function sessionFromJwt(user: {
  id: string
  email?: string | null
  app_metadata?: Record<string, unknown>
  user_metadata?: Record<string, unknown>
}): SessionUser {
  const rawRole = user.app_metadata?.role
  const role: UserRole = rawRole === "admin" || rawRole === "super_admin" ? "admin" : "agent"
  const staffDuty: StaffDuty | undefined =
    rawRole === "super_admin" ? "approver" : rawRole === "admin" ? "reviewer" : undefined
  const name =
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) || user.email || "User"
  return {
    id: user.id,
    role,
    name,
    email: user.email ?? "",
    title: staffDuty === "approver" ? "Final approver" : staffDuty === "reviewer" ? "Reviewer" : "Registered Agent",
    initials: initialsFrom(name, user.email ?? ""),
    staffDuty,
    canFinalize: rawRole === "super_admin",
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      try {
        const supabase = createClient()
        const { data } = await supabase.auth.getSession()
        const current = data.session?.user
        if (!cancelled && current) {
          setUser(sessionFromJwt(current))
          setLoading(false)
          const session = await getSession()
          if (!cancelled && session) setUser(session)
          return
        }
      } catch {
        // Fall through to the server session lookup.
      }

      const session = await getSession()
      if (!cancelled) {
        setUser(session)
        setLoading(false)
      }
    }

    hydrate()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const session = await supabaseSignIn(email, password)
    setUser(session)
    return session
  }, [])

  const register = useCallback(
    async (input: { fullName: string; email: string; phone: string; password: string }) => {
      await supabaseSignUp(input)
    },
    [],
  )

  const logout = useCallback(async () => {
    await supabaseSignOut()
    clearSession()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, backendEnabled: true, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}
