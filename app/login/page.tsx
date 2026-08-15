"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, Eye, EyeOff, Loader2, LogIn, ShieldCheck, UserRound } from "lucide-react"
import { AuthShell } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/lib/auth-context"
import { DEMO_ACCOUNTS, dashboardPathFor } from "@/lib/auth"
import { cn } from "@/lib/utils"

const adminAccount = DEMO_ACCOUNTS.find((a) => a.user.role === "admin")!
const agentAccount = DEMO_ACCOUNTS.find((a) => a.user.role === "agent")!

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingRole, setPendingRole] = useState<"admin" | "agent" | null>(null)

  function attemptLogin(loginEmail: string, loginPassword: string) {
    setError(null)
    setLoading(true)
    setTimeout(() => {
      const user = login(loginEmail, loginPassword)
      setLoading(false)
      setPendingRole(null)
      if (!user) {
        setError("We couldn't match those credentials to a demo account. Try one of the options below.")
        return
      }
      router.push(dashboardPathFor(user.role))
    }, 450)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    attemptLogin(email, password)
  }

  function handleDemoLogin(role: "admin" | "agent") {
    const account = role === "admin" ? adminAccount : agentAccount
    setEmail(account.user.email)
    setPassword(account.password)
    setPendingRole(role)
    attemptLogin(account.user.email, account.password)
  }

  return (
    <AuthShell
      title="Good to see you again"
      description="Pick up right where you left off — your agency, applications, and documents await."
      footer={
        <>
          First time here?{" "}
          <Link href="/register" className="font-medium text-foreground hover:underline">
            Start your journey
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email or phone number</Label>
          <Input
            id="email"
            type="text"
            placeholder="you@kinetic.co.tz"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-10"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="#" className="text-xs font-medium text-accent hover:underline">
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

        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        )}

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox defaultChecked />
          Remember me for 30 days
        </label>

        <Button type="submit" size="lg" className="mt-1 h-10 w-full" disabled={loading}>
          {loading && !pendingRole ? (
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

      <div className="mt-4 rounded-xl border border-dashed border-border p-3">
        <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          Take it for a spin — no sign-up
        </p>
        <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <DemoAccountCard
            icon={ShieldCheck}
            label="Continue as Admin"
            email={adminAccount.user.email}
            password={adminAccount.password}
            loading={loading && pendingRole === "admin"}
            onClick={() => handleDemoLogin("admin")}
          />
          <DemoAccountCard
            icon={UserRound}
            label="Continue as Agent"
            email={agentAccount.user.email}
            password={agentAccount.password}
            loading={loading && pendingRole === "agent"}
            onClick={() => handleDemoLogin("agent")}
          />
        </div>
      </div>
    </AuthShell>
  )
}

function DemoAccountCard({
  icon: Icon,
  label,
  email,
  password,
  loading,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  email: string
  password: string
  loading: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={cn(
        "group flex flex-col items-start gap-2 rounded-lg border border-border bg-card p-3 text-left transition-all",
        "hover:border-accent/50 hover:bg-secondary/50 active:translate-y-px",
        loading && "opacity-70",
      )}
    >
      <span className="flex items-center gap-2 text-sm font-medium text-foreground">
        {loading ? (
          <Loader2 className="size-4 shrink-0 animate-spin text-accent" />
        ) : (
          <Icon className="size-4 shrink-0 text-accent" />
        )}
        {label}
      </span>
      <span className="flex flex-col gap-0.5 text-xs text-muted-foreground">
        <span className="truncate">{email}</span>
        <span className="font-mono">{password}</span>
      </span>
    </button>
  )
}
