import { BadgeCheck } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AppStatusBadge } from "@/components/admin/status-badge"
import { ProfileForm } from "./profile-form"
import { loadAgentWorkspace } from "@/lib/data/workspace"
import { formatDateLong, formatPhoneTZ } from "@/lib/format"
import { SetupBanner } from "@/components/setup-banner"
import { PageBackLink } from "@/components/page-back-link"

export default async function ProfilePage() {
  const { mode, message, agent: currentAgent, application: currentApplication } = await loadAgentWorkspace()
  const memberSince = formatDateLong(currentAgent.memberSince)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-4 md:p-6">
      <SetupBanner mode={mode} message={message} />
      <div>
        <PageBackLink fallback="/agent/settings" label="Back" />
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your personal and account information.</p>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 sm:flex-row sm:items-center">
        <Avatar size="lg">
          <AvatarFallback className="bg-primary text-lg text-primary-foreground">
            {currentAgent.avatarInitials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-base font-semibold text-foreground">{currentAgent.fullName}</p>
            {currentAgent.verified && <BadgeCheck className="size-4 text-success" />}
          </div>
          <p className="text-sm text-muted-foreground">{currentAgent.role} · Agent since {memberSince}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
          <span className="font-mono text-sm font-medium text-foreground">{currentAgent.agentIdNumber}</span>
          <AppStatusBadge status={currentApplication.status} />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-4 text-base font-semibold text-foreground">Personal Information</h2>
        <ProfileForm agent={currentAgent} live={mode === "live"} />
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-3 text-base font-semibold text-foreground">Account</h2>
        <div className="flex flex-col divide-y divide-border">
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-muted-foreground">Phone</span>
            <span className="font-mono text-sm text-foreground">{formatPhoneTZ(currentAgent.phone)}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-muted-foreground">Agent ID Number</span>
            <span className="font-mono text-sm text-foreground">{currentAgent.agentIdNumber}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-muted-foreground">Role</span>
            <span className="text-sm text-foreground">{currentAgent.role}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-muted-foreground">Member since</span>
            <span className="text-sm text-foreground">{memberSince}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
