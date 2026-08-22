"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { ADMIN_IDLE_TIMEOUT_MS, ADMIN_IDLE_WARNING_MS } from "@/lib/admin-session"
import { Button } from "@/components/ui/button"

export function AdminSessionWatchdog() {
  const { logout, user } = useAuth()
  const router = useRouter()
  const [remainingMs, setRemainingMs] = useState<number | null>(null)
  const lastActive = useRef(Date.now())

  useEffect(() => {
    if (!user) return

    const bump = () => {
      lastActive.current = Date.now()
      setRemainingMs(null)
    }

    const events: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "scroll", "touchstart"]
    for (const event of events) window.addEventListener(event, bump, { passive: true })

    const timer = window.setInterval(() => {
      const idle = Date.now() - lastActive.current
      const left = ADMIN_IDLE_TIMEOUT_MS - idle
      if (left <= 0) {
        void logout().then(() => router.push("/login?timeout=1"))
        return
      }
      setRemainingMs(left <= ADMIN_IDLE_WARNING_MS ? left : null)
    }, 1000)

    return () => {
      window.clearInterval(timer)
      for (const event of events) window.removeEventListener(event, bump)
    }
  }, [logout, router, user])

  if (remainingMs == null) return null
  const seconds = Math.max(1, Math.ceil(remainingMs / 1000))

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className="pointer-events-auto flex max-w-lg items-center gap-3 rounded-2xl bg-card px-4 py-3 text-sm shadow-md ring-1 ring-border">
        <p className="text-foreground">
          You will be signed out in {seconds}s due to inactivity.
        </p>
        <Button size="sm" onClick={() => {
          lastActive.current = Date.now()
          setRemainingMs(null)
        }}>
          Stay signed in
        </Button>
      </div>
    </div>
  )
}
