import { ApplicationsTable } from "./applications-table"
import { PageHeader } from "@/components/page-header"
import { loadAdminApplications } from "@/lib/data/workspace"
import { SetupBanner } from "@/components/setup-banner"
import { getSession } from "@/lib/actions/auth"

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const [{ mode, message, applications }, session] = await Promise.all([
    loadAdminApplications(),
    getSession(),
  ])
  return (
    <div className="portal-page">
      <SetupBanner mode={mode} message={message} />
      <PageHeader
        title="Applications"
        description="Search, filter, and review agent applications. Export uses the filters below."
      />

      <ApplicationsTable
        applications={applications}
        initialQuery={q ?? ""}
        live={mode === "live"}
        canFinalize={Boolean(session?.canFinalize)}
      />
    </div>
  )
}
