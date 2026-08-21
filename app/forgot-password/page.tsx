"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { AuthShell } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requestPasswordReset } from "@/lib/actions/auth"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
    try {
      await requestPasswordReset(email)
      setMessage("If that email is registered, a reset link is on its way.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the reset email.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      description="Enter the email on your Kinetic account and we'll send a reset link."
      footer={
        <>
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {error && (
          <p role="alert" className="portal-callout portal-callout-destructive">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="portal-callout portal-callout-success">
            {message}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : "Send reset link"}
        </Button>
      </form>
    </AuthShell>
  )
}
