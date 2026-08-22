import { ApplicationWizard } from "@/components/agent/application-wizard"
import { CorrectionChecklist } from "@/components/correction-checklist"
import { listLookups } from "@/lib/actions/lookups"
import {
  emptyApplication,
  findEditableApplication,
  findInFlightApplication,
  loadAgentWorkspace,
} from "@/lib/data/workspace"
import { SetupBanner } from "@/components/setup-banner"
import { PageBackLink } from "@/components/page-back-link"
import { PageHeader } from "@/components/page-header"
import { DocumentExpiryBanner } from "@/components/documents/expiry-banner"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function ApplyPage() {
  const workspacePromise = loadAgentWorkspace()
  const lookupsPromise = listLookups().catch(() => ({
    channels: [] as { id: string; name: string; code: string }[],
    sectors: [] as { id: string; name: string; code: string }[],
  }))
  const { mode, message, agent, applications } = await workspacePromise
  const editable = findEditableApplication(applications)
  const inFlight = findInFlightApplication(applications)

  if (mode === "live" && !editable && inFlight) {
    redirect(`/agent/applications/${inFlight.id}`)
  }

  if (agent.lifecycleStatus === "Suspended") {
    return (
      <div className="portal-page-form gap-4">
        <SetupBanner mode={mode} message={message} />
        <PageHeader
          back={<PageBackLink fallback="/agent/dashboard" />}
          title="Application paused"
          description="This account is suspended. You can review existing records, but you cannot start or update an application until an administrator reactivates it."
        />
      </div>
    )
  }

  const application = editable ?? emptyApplication(agent)
  const lookups = mode === "live" ? await lookupsPromise : { channels: [], sectors: [] }

  return (
    <div className="portal-page-form">
      <SetupBanner mode={mode} message={message} />
      <PageHeader
        back={<PageBackLink fallback="/agent/dashboard" />}
        title={application.status === "NEEDS_CORRECTION" ? "Update Application" : "New Application"}
        description="Complete the steps below to submit your agent application."
        action={
          application.status === "DRAFT" || application.id === "draft" ? (
            <span className="status-badge status-badge-muted">Draft</span>
          ) : null
        }
      />
      <DocumentExpiryBanner expireDate={application.expireDate} />
      {application.status === "NEEDS_CORRECTION" ? (
        <CorrectionChecklist
          documents={application.documents}
          items={application.corrections}
          summary={application.correctionSummary}
          fixHref="/agent/apply"
          showFix={false}
        />
      ) : null}
      <ApplicationWizard agent={agent} application={application} lookups={lookups} live={mode === "live"} />
    </div>
  )
}
