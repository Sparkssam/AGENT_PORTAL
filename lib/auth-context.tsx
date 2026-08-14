"use client"

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { clearSession, findAccount, readSession, writeSession, SESSION_EVENT, type SessionUser } from "@/lib/auth"

interface AuthContextValue {
  user: SessionUser | null
  loading: boolean
  login: (email: string, password: string) => SessionUser | null
  loginAsUser: (user: SessionUser) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setUser(readSession())
    setLoading(false)

    function handleChange() {
      setUser(readSession())
    }

    window.addEventListener(SESSION_EVENT, handleChange)
    window.addEventListener("storage", handleChange)
    return () => {
      window.removeEventListener(SESSION_EVENT, handleChange)
      window.removeEventListener("storage", handleChange)
    }
  }, [])

  const login = useCallback((email: string, password: string) => {
    const account = findAccount(email, password)
    if (account) {
      writeSession(account)
      setUser(account)
    }
    return account
  }, [])

  const loginAsUser = useCallback((sessionUser: SessionUser) => {
    writeSession(sessionUser)
    setUser(sessionUser)
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, loginAsUser, logout }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}
