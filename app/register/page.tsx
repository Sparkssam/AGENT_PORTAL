"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, UserPlus } from "lucide-react"
import { AuthShell } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export default function RegisterPage() {
  const router = useRouter()
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!agreed) return
    setLoading(true)
    // Demo-only: creates no real account yet — routes into the application
    // wizard so a brand-new agent can start their onboarding immediately.
    setTimeout(() => router.push("/agent/applications/new"), 500)
  }

  return (
    <AuthShell
      title="Create your account"
      description="Start your application to become an authorized Kinetic agent."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" placeholder="Enter your full name" required className="h-10" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">Phone number</Label>
          <Input id="phone" type="tel" placeholder="+255 7XX XXX XXX" required className="h-10" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="regEmail">Email address</Label>
          <Input id="regEmail" type="email" placeholder="Enter your email" required className="h-10" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="regPassword">Password</Label>
            <Input id="regPassword" type="password" placeholder="Create a password" required className="h-10" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input id="confirmPassword" type="password" placeholder="Confirm your password" required className="h-10" />
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
          <span>
            I agree to the{" "}
            <Link href="#" className="font-medium text-foreground hover:underline">
              Terms and Conditions
            </Link>{" "}
            and{" "}
            <Link href="#" className="font-medium text-foreground hover:underline">
              Privacy Policy
            </Link>
            .
          </span>
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
    </AuthShell>
  )
}
