"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AgentProfile } from "@/lib/agent-data"
import { updateProfile } from "@/lib/actions/agents"

export function ProfileForm({ agent, live = false }: { agent: AgentProfile; live?: boolean }) {
  const router = useRouter()
  const [form, setForm] = useState({
    fullName: agent.fullName,
    email: agent.email,
    phone: agent.phone,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      if (live) {
        await updateProfile({ fullName: form.fullName, phone: form.phone })
        router.refresh()
      }
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="profileName">Full name</Label>
          <Input
            id="profileName"
            value={form.fullName}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, fullName: e.target.value }))
              setSaved(false)
            }}
            className="h-10"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="profilePhone">Phone number</Label>
          <Input
            id="profilePhone"
            value={form.phone}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, phone: e.target.value }))
              setSaved(false)
            }}
            className="h-10"
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="profileEmail">Email address</Label>
          <Input id="profileEmail" type="email" value={form.email} disabled className="h-10" />
          <p className="text-xs text-muted-foreground">Email is managed through your login account.</p>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save data-icon="inline-start" />
              Save changes
            </>
          )}
        </Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-success">
            <Check className="size-4" />
            Changes saved
          </span>
        )}
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>
    </form>
  )
}
