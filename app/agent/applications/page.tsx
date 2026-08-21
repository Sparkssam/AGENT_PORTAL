import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { AppStatusBadge, DepositStatusBadge } from "@/components/admin/status-badge"
import { HelpHint } from "@/components/help/help-hint"
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
    <div className="portal-page">
      <SetupBanner mode={mode} message={message} />
      <PageHeader
        title="My Applications"
        description="Track and manage your submitted applications."
        action={
          suspended ? null : editable ? (
            <Button render={<Link href="/agent/apply" />} nativeButton={false}>
              Continue application
            </Button>
          ) : canStartAnother ? (
            <Button render={<Link href="/agent/apply" />} nativeButton={false}>
              <Plus data-icon="inline-start" />
              New Application
            </Button>
          ) : null
        }
      />

      <div className="portal-table">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="portal-table-head">
                <th className="px-4 py-3">App Number</th>
                <th className="px-4 py-3">Business Name</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">
                  <span className="inline-flex items-center gap-1">
                    App Status
                    <HelpHint articleId="status-meanings" />
                  </span>
                </th>
                <th className="px-4 py-3">Deposit</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {myApplications.map((app) => (
                <tr key={app.id} className="portal-table-row">
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
        <div className="portal-card text-center">
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
