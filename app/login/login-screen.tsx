"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, LogIn, UserPlus } from "lucide-react"
import { AuthShell } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/lib/auth-context"
import { dashboardPathFor } from "@/lib/auth"
import { cn } from "@/lib/utils"

function errorMessage(err: unknown) {
  if (err instanceof Error && err.message) return err.message
  return "Something went wrong. Try again."
}

export function LoginScreen({ initialMode = "signin" }: { initialMode?: "signin" | "signup" }) {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<"signin" | "signup">(initialMode)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [agreed, setAgreed] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setLoading(true)
    try {
      const user = await login(email, password)
      if (!user) {
        setError("We couldn't match those credentials. Check your email and password.")
        return
      }
      window.location.assign(dashboardPathFor(user.role))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (!agreed) return
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }
    setError(null)
    setNotice(null)
    setLoading(true)
    try {
      await register({ fullName, email, phone, password })
      setPassword("")
      setConfirmPassword("")
      setAgreed(false)
      setMode("signin")
      setNotice("Account created. Sign in with your email and password to continue.")
      setLoading(false)
    } catch (err) {
      setError(errorMessage(err))
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title={mode === "signin" ? "Sign in to Kinetic" : "Create your agent account"}
      description={
        mode === "signin"
          ? "Use the email and password from your registration."
          : "Register with your real details. This creates your live Kinetic account."
      }
      footer={
        mode === "signin" ? (
          <>
            First time here?{" "}
            <button
              type="button"
              className="font-medium text-foreground hover:underline"
              onClick={() => {
                setError(null)
                setNotice(null)
                setMode("signup")
              }}
            >
              Create an account
            </button>
          </>
        ) : (
          <>
            Already registered?{" "}
            <button
              type="button"
              className="font-medium text-foreground hover:underline"
              onClick={() => {
                setError(null)
                setMode("signin")
              }}
            >
              Sign in
            </button>
          </>
        )
      }
    >
      <div className="mb-4 grid grid-cols-2 rounded-lg bg-muted p-1">
        <button
          type="button"
          onClick={() => {
            setError(null)
            setMode("signin")
          }}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            mode === "signin" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => {
            setError(null)
            setNotice(null)
            setMode("signup")
          }}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            mode === "signup" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          Create account
        </button>
      </div>

      {mode === "signin" ? (
        <form onSubmit={handleSignIn} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email or phone number</Label>
            <Input
              id="email"
              type="text"
              placeholder="you@kinetic.co.tz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              className="h-10"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-xs font-medium text-accent hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="h-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {notice && (
            <p
              role="status"
              className="flex items-start gap-2 rounded-lg border border-success/25 bg-success/10 px-3 py-2.5 text-sm text-foreground"
            >
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
              {notice}
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="mt-1 h-10 w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn data-icon="inline-start" />
                Sign in
              </>
            )}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleSignUp} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
              className="h-10"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+255 7XX XXX XXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoComplete="tel"
              className="h-10"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="regEmail">Email address</Label>
            <Input
              id="regEmail"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="h-10"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="regPassword">Password</Label>
              <Input
                id="regPassword"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="h-10"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="h-10"
              />
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {error}
            </p>
          )}

          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
            <span>I agree to the Terms and Conditions and Privacy Policy.</span>
          </label>

          <Button type="submit" size="lg" className="mt-1 h-10 w-full" disabled={loading || !agreed}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                <UserPlus data-icon="inline-start" />
                Create account
              </>
            )}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
