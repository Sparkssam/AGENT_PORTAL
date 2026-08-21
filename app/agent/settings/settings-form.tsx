"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { requestPasswordReset } from "@/lib/actions/auth"

export function SettingsForm({ email, live }: { email: string; live: boolean }) {
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleReset() {
    setSending(true)
    setMessage(null)
    setError(null)
    try {
      if (live) await requestPasswordReset(email)
      setMessage("If that email is registered, a reset link is on its way.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the reset email.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {message && <p className="text-sm text-foreground">{message}</p>}
      <Button type="button" onClick={() => void handleReset()} disabled={sending || !email}>
        {sending ? <Loader2 className="size-4 animate-spin" /> : "Send password reset email"}
      </Button>
    </div>
  )
}
