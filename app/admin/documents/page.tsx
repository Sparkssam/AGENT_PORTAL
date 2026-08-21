import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { DocumentsTable } from "./documents-table"
import { loadAdminApplications } from "@/lib/data/workspace"
import { SetupBanner } from "@/components/setup-banner"
import { listFlaggedVerifications } from "@/lib/actions/verifications"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"

export const metadata = {
  title: "Documents — Kinetic Admin",
  description: "Search, preview, download, and manage uploaded documents across all agents.",
}

export default async function DocumentsPage() {
  const { mode, message, applications } = await loadAdminApplications()
  const flagged = mode === "live" ? await listFlaggedVerifications().catch(() => []) : []
  return (
    <div className="portal-page">
      <SetupBanner mode={mode} message={message} />
      <PageHeader
        title="Documents"
        description="Monitor, search, preview, and download files uploaded across all agents. Application review and agent approval stay on Applications."
        action={
          <Button render={<Link href="/admin/applications" />} nativeButton={false}>
            Open Applications
            <ArrowRight data-icon="inline-end" />
          </Button>
        }
      />
      <DocumentsTable applications={applications} live={mode === "live"} flagged={flagged} />
    </div>
  )
}
