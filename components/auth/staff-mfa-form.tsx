"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { AlertCircle, Loader2, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { enrollStaffTotp, getMfaStatus, verifyStaffTotp } from "@/lib/actions/mfa"

export function StaffMfaForm({
  onComplete,
  title = "Authenticator required",
  variant = "gate",
}: {
  onComplete?: () => void
  title?: string
  variant?: "gate" | "settings"
}) {
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [qr, setQr] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [enrolled, setEnrolled] = useState(false)
  const [active, setActive] = useState(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const status = await getMfaStatus()
        if (cancelled) return
        if (!status.required || status.verified) {
          if (variant === "settings") {
            setActive(true)
            setEnrolled(status.enrolled)
            setLoading(false)
            return
          }
          onCompleteRef.current?.()
          return
        }
        setEnrolled(status.enrolled)
        if (status.enrolled && status.factorId) {
          setFactorId(status.factorId)
          setLoading(false)
          return
        }
        const enrolledFactor = await enrollStaffTotp()
        if (cancelled) return
        setFactorId(enrolledFactor.factorId)
        setQr(enrolledFactor.qr)
        setSecret(enrolledFactor.secret)
        setLoading(false)
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Could not start authenticator setup"
          if (/mfa is disabled|not enabled|unsupported/i.test(message)) {
            if (typeof window !== "undefined") {
              window.sessionStorage.setItem("kinetic.mfa.unavailable", "1")
            }
            if (variant === "settings") {
              setActive(true)
              setLoading(false)
              return
            }
            onCompleteRef.current?.()
            return
          }
          setError(message)
          setLoading(false)
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [variant])

  async function handleVerify(e: FormEvent) {
    e.preventDefault()
    if (!factorId) return
    setBusy(true)
    setError(null)
    try {
      await verifyStaffTotp(factorId, code)
      onComplete?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code is not valid")
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Checking authenticator…
      </div>
    )
  }

  if (active && variant === "settings") {
    return (
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <ShieldCheck className="size-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">
            {enrolled
              ? "This staff account is protected with an authenticator app."
              : "Enable Multi-Factor Authentication in the Supabase project, then sign in again to enrol."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleVerify} className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <ShieldCheck className="size-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">
            {enrolled && !qr
              ? "Open your authenticator app and enter the 6-digit code."
              : "Scan the QR code with Google Authenticator, Authy, or a similar app, then enter the 6-digit code."}
          </p>
        </div>
      </div>

      {qr ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-card p-4 ring-1 ring-border/60">
          {/* QR is a data URL from Supabase enroll, not a remote asset. */}
          <img src={qr} alt="Authenticator QR code" className="size-44 rounded-lg bg-white p-2" />
          {secret ? (
            <p className="break-all text-center font-mono text-xs text-muted-foreground">
              Manual key: {secret}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="totp">6-digit code</Label>
        <Input
          id="totp"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          required
        />
      </div>

      {error ? (
        <p role="alert" className="portal-callout portal-callout-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={busy || code.length !== 6}>
        {busy ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Verifying…
          </>
        ) : (
          "Continue"
        )}
      </Button>
    </form>
  )
}
