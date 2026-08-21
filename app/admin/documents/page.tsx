import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { DocumentsTable } from "./documents-table"
import { loadAdminApplications } from "@/lib/data/workspace"
import { SetupBanner } from "@/components/setup-banner"
import { listFlaggedVerifications } from "@/lib/actions/verifications"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Documents — Kinetic Admin",
  description: "Search, preview, download, and manage uploaded documents across all agents.",
}

export default async function DocumentsPage() {
  const { mode, message, applications } = await loadAdminApplications()
  const flagged = mode === "live" ? await listFlaggedVerifications().catch(() => []) : []
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-8 p-4 md:px-8 md:pb-10 md:pt-2">
      <SetupBanner mode={mode} message={message} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            <span className="h-8 w-1.5 rounded-full bg-accent" aria-hidden />
            Document Management Center
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Monitor, search, preview, and download files uploaded across all agents. Application review and agent
            approval stay on Applications.
          </p>
        </div>
        <Button size="lg" render={<Link href="/admin/applications" />} nativeButton={false}>
          Open Applications
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>
      <DocumentsTable applications={applications} live={mode === "live"} flagged={flagged} />
    </div>
  )
}
