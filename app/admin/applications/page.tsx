import { ApplicationsTable } from "./applications-table"
import { ExportCsvButton } from "@/components/admin/export-csv-button"
import { PageHeader } from "@/components/page-header"
import { loadAdminApplications } from "@/lib/data/workspace"
import { SetupBanner } from "@/components/setup-banner"

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const { mode, message, applications } = await loadAdminApplications()
  return (
    <div className="portal-page">
      <SetupBanner mode={mode} message={message} />
      <PageHeader
        title="Applications"
        description="Search, filter, and review agent applications."
        action={<ExportCsvButton live={mode === "live"} />}
      />

      <ApplicationsTable applications={applications} initialQuery={q ?? ""} />
    </div>
  )
}
