"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Circle, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DocumentUploadDialog } from "@/components/documents/document-upload-dialog"
import { DocumentExampleThumb } from "@/components/help/document-example-thumb"
import { RejectedDocumentHelp } from "@/components/help/rejected-document-help"
import { documentChecklistProgress } from "@/lib/agent-data"
import { canAgentChangeDocument } from "@/lib/backend/status"
import type { Application, Document } from "@/lib/admin-data"

export function AgentDocumentChecklist({
  application,
  live,
  locked = false,
}: {
  application: Application
  live: boolean
  locked?: boolean
}) {
  const [app, setApp] = useState(application)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeType, setActiveType] = useState<string | undefined>()
  const checklist = documentChecklistProgress(app.documents)

  function openUpload(type?: string) {
    setActiveType(type)
    setDialogOpen(true)
  }

  return (
    <section className="portal-card">
      <div className="flex items-center justify-between gap-3">
        <p className="portal-section-title">To-do</p>
        <Link href="/agent/apply" className="text-muted-foreground hover:text-foreground">
          <ArrowRight className="size-4" />
        </Link>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {checklist.uploaded} of {checklist.total} documents uploaded
      </p>
      <ul className="mt-5 flex flex-col gap-1">
        {app.documents.map((doc: Document) => {
          const done = doc.status !== "missing" && doc.status !== "rejected"
          const canFix = !locked && canAgentChangeDocument(application.status, doc.required !== false)
          return (
            <li key={doc.id} className="flex flex-col gap-1 rounded-2xl px-1 py-2.5">
              <div className="flex items-start gap-3">
              <DocumentExampleThumb type={doc.type} className="mt-0.5" />
              <button
                type="button"
                disabled={!canFix || done}
                onClick={() => openUpload(doc.type)}
                className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-border disabled:opacity-70"
                aria-label={done ? `${doc.name} complete` : `Upload ${doc.name}`}
              >
                {done ? <span className="size-2.5 rounded-full bg-primary" /> : <Circle className="size-3 text-transparent" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{doc.name}</p>
                <p className="text-xs text-muted-foreground">
                  {doc.status === "rejected"
                    ? doc.reason || "Re-upload requested"
                    : doc.status === "missing"
                      ? "Not uploaded yet"
                      : doc.status === "verified"
                        ? "Approved by review"
                        : "Waiting for review"}
                </p>
              </div>
              {!done && (
                <Button size="sm" variant="outline" disabled={!canFix} onClick={() => openUpload(doc.type)}>
                  <Upload data-icon="inline-start" />
                  {doc.status === "rejected" ? "Re-upload" : "Upload"}
                </Button>
              )}
              </div>
              {doc.status === "rejected" ? (
                <RejectedDocumentHelp
                  agentName={app.agentName}
                  applicationNumber={app.appNumber}
                  documentType={doc.type}
                  documentName={doc.name}
                  reason={doc.reason}
                />
              ) : null}
            </li>
          )
        })}
      </ul>
      <DocumentUploadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        applicationId={app.id}
        documents={app.documents}
        initialType={activeType}
        live={live}
        onApplicationReady={(next) => setApp(next)}
        onComplete={(next) => setApp((current) => ({ ...current, documents: next }))}
      />
    </section>
  )
}
