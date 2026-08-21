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
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-8 md:px-6 md:py-10">
        <SetupBanner mode={mode} message={message} />
        <PageBackLink fallback="/agent/dashboard" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Application paused</h1>
        <p className="text-sm text-muted-foreground">
          This account is suspended. You can review existing records, but you cannot start or update an application
          until an administrator reactivates it.
        </p>
      </div>
    )
  }

  const application = editable ?? emptyApplication(agent)
  const lookups = mode === "live" ? await lookupsPromise : { channels: [], sectors: [] }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 md:px-6 md:py-10">
      <SetupBanner mode={mode} message={message} />
      <div>
        <PageBackLink fallback="/agent/dashboard" />
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {application.status === "NEEDS_CORRECTION" ? "Update Application" : "New Application"}
          </h1>
          {application.status === "DRAFT" || application.id === "draft" ? (
            <span className="inline-flex h-5 items-center rounded-md bg-muted px-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Draft
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Complete the steps below to submit your agent application.
        </p>
      </div>
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
