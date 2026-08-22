"use client"

import { useEffect, useState, type ReactNode } from "react"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getMfaStatus } from "@/lib/actions/mfa"
import { StaffMfaForm } from "@/components/auth/staff-mfa-form"

export function StaffMfaGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const [ready, setReady] = useState(false)
  const [needed, setNeeded] = useState(false)

  useEffect(() => {
    if (loading || !user) return
    if (user.role !== "admin") {
      setReady(true)
      return
    }
    if (typeof window !== "undefined" && window.sessionStorage.getItem("kinetic.mfa.unavailable")) {
      setReady(true)
      return
    }
    let cancelled = false
    void getMfaStatus()
      .then((status) => {
        if (cancelled) return
        if (!status.required || status.verified) {
          setReady(true)
          return
        }
        setNeeded(true)
        setReady(true)
      })
      .catch(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [loading, user])

  if (loading || !ready) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (needed) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border/60">
          <StaffMfaForm onComplete={() => {
            setNeeded(false)
          }} />
        </div>
      </div>
    )
  }

  return <>{children}</>
}
