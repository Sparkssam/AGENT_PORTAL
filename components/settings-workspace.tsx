"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  KeyRound,
  Mail,
  Shield,
  UserRound,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WorkspaceSearch } from "@/components/workspace-search"
import { SettingsForm } from "@/app/agent/settings/settings-form"
import { AppStatusBadge } from "@/components/admin/status-badge"
import { PageBackLink } from "@/components/page-back-link"
import { PageHeader } from "@/components/page-header"
import { statusLabels, type AppStatus } from "@/lib/domain"
import { cn } from "@/lib/utils"

type SettingsRow = {
  id: string
  tab: "account" | "password" | "notifications" | "profile"
  title: string
  detail: string
  meta: string
  href?: string
  icon: typeof Mail
}

function SummaryCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string
  value: string
  detail: string
  icon: typeof Mail
}) {
  return (
    <div className="portal-stat-card">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="size-4 text-muted-foreground/70" />
      </div>
      <p className="mt-3 truncate text-lg font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  )
}

function SettingsRowCard({ row }: { row: SettingsRow }) {
  const Icon = row.icon
  const inner = (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="size-4 text-foreground" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">{row.title}</span>
        <span className="mt-0.5 block truncate text-sm text-muted-foreground">{row.detail}</span>
      </span>
      <span className="hidden text-right text-xs text-muted-foreground sm:block">{row.meta}</span>
      {row.href ? <ChevronRight className="size-4 shrink-0 text-muted-foreground" /> : null}
    </>
  )

  if (row.href) {
    return (
      <li>
        <Link
          href={row.href}
          className="flex items-center gap-3 rounded-3xl bg-card px-4 py-3.5 shadow-sm ring-1 ring-border/60 transition hover:bg-muted/40"
        >
          {inner}
        </Link>
      </li>
    )
  }

  return (
    <li className="flex items-center gap-3 rounded-3xl bg-card px-4 py-3.5 shadow-sm ring-1 ring-border/60">
      {inner}
    </li>
  )
}

export function SettingsWorkspace({
  portal,
  email,
  name,
  live,
  role,
  applicationStatus,
  memberSince,
  verified,
}: {
  portal: "agent" | "admin"
  email: string
  name: string
  live: boolean
  role?: string
  applicationStatus?: AppStatus
  memberSince?: string
  verified?: boolean
}) {
  const [query, setQuery] = useState("")
  const isAgent = portal === "agent"

  const rows = useMemo<SettingsRow[]>(() => {
    const list: SettingsRow[] = [
      {
        id: "email",
        tab: "account",
        title: name || "Account",
        detail: email || "No email on file",
        meta: isAgent ? "Agent login" : "Admin login",
        icon: Mail,
      },
      {
        id: "password",
        tab: "password",
        title: "Password",
        detail: "Send a reset link to this email",
        meta: live ? "Ready" : "Connect backend",
        icon: KeyRound,
      },
      {
        id: "notifications",
        tab: "notifications",
        title: "Notifications",
        detail: "Corrections, rejects, and completed cases",
        meta: "Header bell + email",
        icon: Bell,
      },
    ]
    if (isAgent) {
      list.splice(1, 0, {
        id: "profile",
        tab: "profile",
        title: "Profile",
        detail: "Name, phone, and agent ID",
        meta: verified ? "Verified" : "Open profile",
        href: "/agent/profile",
        icon: UserRound,
      })
    }
    return list
  }, [email, isAgent, live, name, verified])

  const filtered = rows.filter((row) => {
    const needle = query.trim().toLowerCase()
    if (!needle) return true
    return `${row.title} ${row.detail} ${row.meta}`.toLowerCase().includes(needle)
  })

  return (
    <>
      <PageHeader
        back={<PageBackLink fallback={isAgent ? "/agent/dashboard" : "/admin/dashboard"} />}
        title="Settings"
        description="Account, password, and notification preferences."
        action={
          <WorkspaceSearch
            value={query}
            onChange={setQuery}
            placeholder="Search settings..."
            className="w-full sm:w-72"
          />
        }
      />

      <Tabs defaultValue="account" className="gap-5">
        <TabsList variant="line" className="h-auto w-full justify-start gap-4 overflow-x-auto bg-transparent p-0">
          <TabsTrigger value="account" className="px-0">
            Account
          </TabsTrigger>
          <TabsTrigger value="password" className="px-0">
            Password
          </TabsTrigger>
          <TabsTrigger value="notifications" className="px-0">
            Notifications
          </TabsTrigger>
          {isAgent ? (
            <TabsTrigger value="profile" className="px-0">
              Profile
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="account" className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Account" value={email || "—"} detail="Signed-in email" icon={Mail} />
            <SummaryCard
              label={isAgent ? "Application" : "Role"}
              value={
                isAgent
                  ? applicationStatus
                    ? statusLabels[applicationStatus]
                    : "Draft"
                  : role || "Administrator"
              }
              detail={isAgent ? "Current case status" : "This admin workspace"}
              icon={isAgent ? CheckCircle2 : Shield}
            />
            <SummaryCard
              label="Security"
              value="Password"
              detail={live ? "Reset available by email" : "Backend not connected"}
              icon={KeyRound}
            />
            <SummaryCard
              label="Alerts"
              value="On"
              detail="In-app notices, email when configured"
              icon={Bell}
            />
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-foreground">
              Account details{query.trim() ? ` · ${filtered.length}` : ""}
            </p>
            <ul className="flex flex-col gap-2">
              {filtered.length === 0 ? (
                <li className="rounded-3xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  No settings match that search.
                </li>
              ) : (
                filtered.map((row) => <SettingsRowCard key={row.id} row={row} />)
              )}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="password" className="flex flex-col gap-4">
          <div className="portal-card">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-muted">
                <KeyRound className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Password</p>
                <p className="text-sm text-muted-foreground">
                  {email
                    ? `We email a reset link to ${email}.`
                    : "Sign in to send a password reset to this account."}
                </p>
              </div>
            </div>
            <SettingsForm email={email} live={live} />
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="flex flex-col gap-4">
          <div className="portal-card">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-muted">
                <Bell className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Status, correction, and reject updates appear on the header bell. Email is sent when the portal
                  is configured with an outbound mail key.
                </p>
              </div>
            </div>
            {isAgent ? (
              <p className="text-sm text-muted-foreground">
                Open the bell in the header to review recent updates.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Agents receive in-app notices for correction, reject, and completed.
              </p>
            )}
          </div>
        </TabsContent>

        {isAgent ? (
          <TabsContent value="profile" className="flex flex-col gap-4">
            <div className="portal-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-muted">
                    <UserRound className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{name || "Profile"}</p>
                    <p className="text-sm text-muted-foreground">
                      Name and phone are managed on your profile.
                      {memberSince ? ` Member since ${memberSince}.` : ""}
                    </p>
                  </div>
                </div>
                {applicationStatus ? <AppStatusBadge status={applicationStatus} /> : null}
              </div>
              <Link
                href="/agent/profile"
                className={cn(
                  "mt-4 inline-flex items-center gap-1 text-sm font-medium text-foreground underline-offset-4 hover:underline",
                )}
              >
                Open profile
                <ChevronRight className="size-4" />
              </Link>
            </div>
          </TabsContent>
        ) : null}
      </Tabs>
    </>
  )
}
