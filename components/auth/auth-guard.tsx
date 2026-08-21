"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { dashboardPathFor, type UserRole } from "@/lib/auth"

export function AuthGuard({ role, children }: { role: UserRole; children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace("/login")
    } else if (user.role !== role) {
      router.replace(dashboardPathFor(user.role))
    }
  }, [loading, user, role, router])

  if (!loading && (!user || user.role !== role)) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return <>{children}</>
}
