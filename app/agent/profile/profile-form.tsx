"use client"

import { useState } from "react"
import { Check, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AgentProfile } from "@/lib/agent-data"

export function ProfileForm({ agent }: { agent: AgentProfile }) {
  const [form, setForm] = useState({
    fullName: agent.fullName,
    email: agent.email,
    phone: agent.phone,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setTimeout(() => {
      setSaving(false)
      setSaved(true)
    }, 700)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          <Input
            id="profileEmail"
            type="email"
            value={form.email}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, email: e.target.value }))
              setSaved(false)
            }}
            className="h-10"
          />
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
      </div>
    </form>
  )
}
