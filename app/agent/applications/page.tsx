import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AppStatusBadge, DepositStatusBadge } from "@/components/admin/status-badge"
import {
  findEditableApplication,
  findInFlightApplication,
  isNewApplicant,
  loadAgentWorkspace,
} from "@/lib/data/workspace"
import { formatDateLong } from "@/lib/format"
import { SetupBanner } from "@/components/setup-banner"
import { redirect } from "next/navigation"

export default async function MyApplicationsPage() {
  const { mode, message, agent, applications: myApplications } = await loadAgentWorkspace()
  if (mode === "live" && isNewApplicant(myApplications) && agent.lifecycleStatus !== "Suspended") {
    redirect("/agent/apply")
  }

  const editable = findEditableApplication(myApplications)
  const inFlight = findInFlightApplication(myApplications)
  const suspended = agent.lifecycleStatus === "Suspended"
  const canStartAnother = !suspended && !editable && !inFlight

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 p-4 md:p-6">
      <SetupBanner mode={mode} message={message} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">My Applications</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track and manage your submitted applications.</p>
        </div>
        {suspended ? null : editable ? (
          <Button render={<Link href="/agent/apply" />} nativeButton={false}>
            Continue application
          </Button>
        ) : canStartAnother ? (
          <Button render={<Link href="/agent/apply" />} nativeButton={false}>
            <Plus data-icon="inline-start" />
            New Application
          </Button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                <th className="px-4 py-3">App Number</th>
                <th className="px-4 py-3">Business Name</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">App Status</th>
                <th className="px-4 py-3">Deposit</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {myApplications.map((app) => (
                <tr key={app.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/agent/applications/${app.id}`}
                      className="font-mono text-sm font-medium text-foreground hover:underline"
                    >
                      {app.appNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-foreground">{app.businessName}</td>
                  <td className="px-4 py-3.5 text-foreground">{app.channel}</td>
                  <td className="px-4 py-3.5 text-muted-foreground">
                    {app.status === "DRAFT" ? "—" : formatDateLong(app.submittedAt, "local")}
                  </td>
                  <td className="px-4 py-3.5">
                    <AppStatusBadge status={app.status} />
                  </td>
                  <td className="px-4 py-3.5">
                    <DepositStatusBadge status={app.depositStatus} />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      render={<Link href={`/agent/applications/${app.id}`} />}
                      nativeButton={false}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {canStartAnother ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Need to register another outlet? Start a new application for that location.
          </p>
          <Button variant="outline" className="mt-3" render={<Link href="/agent/apply" />} nativeButton={false}>
            <Plus data-icon="inline-start" />
            Start another application
          </Button>
        </div>
      ) : null}
    </div>
  )
}
