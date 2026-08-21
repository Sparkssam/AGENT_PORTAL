import { ApplicationsTable } from "./applications-table"
import { ExportCsvButton } from "@/components/admin/export-csv-button"
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
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 p-4 md:p-6">
      <SetupBanner mode={mode} message={message} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Applications</h1>
          <p className="mt-1 text-sm text-muted-foreground">Search, filter, and review agent applications.</p>
        </div>
        <ExportCsvButton live={mode === "live"} />
      </div>

      <ApplicationsTable applications={applications} initialQuery={q ?? ""} />
    </div>
  )
}
