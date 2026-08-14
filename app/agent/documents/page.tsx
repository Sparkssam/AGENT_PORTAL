import { documentChecklistProgress, currentApplication } from "@/lib/agent-data"
import { DocumentsManager } from "./documents-manager"

export default function DocumentsPage() {
  const checklist = documentChecklistProgress(currentApplication.documents)

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Documents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload, preview, and manage the documents attached to your application.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5">
          <span className="text-sm font-medium text-foreground">{checklist.uploaded}</span>
          <span className="text-sm text-muted-foreground">of {checklist.total} uploaded</span>
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${checklist.percent}%` }} />
          </div>
        </div>
      </div>

      <DocumentsManager
        documents={currentApplication.documents}
        agentName={currentApplication.agentName}
        network={currentApplication.channel}
      />
    </div>
  )
}
