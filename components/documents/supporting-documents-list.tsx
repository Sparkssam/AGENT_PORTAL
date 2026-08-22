"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Check, Eye, FolderOpen, Loader2, Pencil, Trash2, Upload } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DocumentUploadDialog } from "@/components/documents/document-upload-dialog"
import { DocumentExampleThumb } from "@/components/help/document-example-thumb"
import { HelpHint } from "@/components/help/help-hint"
import { RejectedDocumentHelp } from "@/components/help/rejected-document-help"
import { getDocumentFile, type Application, type AppStatus, type Document } from "@/lib/domain"
import { saveDraft } from "@/lib/actions/applications"
import { clearDocumentFile, signedGet } from "@/lib/actions/documents"
import { canAgentChangeDocument } from "@/lib/backend/status"
import {
  documentSlotProgress,
  formatBytes,
  isFilledDocumentStatus,
  isPersistedDocumentId,
} from "@/lib/documents/catalog"
import { cn } from "@/lib/utils"

const cardBadgeClass: Record<"EMPTY" | "REJECTED" | "INCOMPLETE" | "COMPLETE", string> = {
  EMPTY: "status-badge-muted",
  REJECTED: "status-badge-destructive",
  INCOMPLETE: "status-badge-muted",
  COMPLETE: "status-badge-success",
}

export function SupportingDocumentsList({
  documents,
  applicationId,
  live = false,
  readOnly = false,
  applicationStatus,
  includeDepositProof = false,
  framed = true,
  onDocumentsChange,
  onApplicationReady,
  onError,
}: {
  documents: Document[]
  applicationId?: string
  live?: boolean
  readOnly?: boolean
  applicationStatus?: AppStatus
  includeDepositProof?: boolean
  framed?: boolean
  onDocumentsChange: (documents: Document[]) => void
  onApplicationReady?: (application: Application) => void
  onError?: (message: string | null) => void
}) {
  const [docs, setDocs] = useState(documents)
  const [appId, setAppId] = useState(applicationId)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeType, setActiveType] = useState<string | undefined>()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Document | null>(null)
  const progress = useMemo(() => documentSlotProgress(docs, includeDepositProof), [docs, includeDepositProof])

  useEffect(() => {
    setDocs(documents)
  }, [documents])

  useEffect(() => {
    setAppId(applicationId)
  }, [applicationId])

  function emit(next: Document[]) {
    setDocs(next)
    onDocumentsChange(next)
  }

  async function ensureApplication() {
    if (!live) return appId
    if (appId && appId !== "draft") return appId
    const saved = await saveDraft({})
    setAppId(saved.id)
    onApplicationReady?.(saved)
    if (saved.documents.length) emit(saved.documents)
    return saved.id
  }

  async function openUpload(type?: string) {
    onError?.(null)
    try {
      await ensureApplication()
      setActiveType(type)
      setDialogOpen(true)
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Could not start upload")
    }
  }

  async function handleView(doc: Document) {
    if (!isFilledDocumentStatus(doc.status) && doc.status !== "rejected") return
    setBusyId(doc.id)
    onError?.(null)
    try {
      if (live && isPersistedDocumentId(doc.id)) {
        const signed = await signedGet(doc.id, "inline")
        window.open(signed.getUrl, "_blank", "noopener,noreferrer")
        return
      }
      const file = getDocumentFile(doc)
      if (file?.url) window.open(file.url, "_blank", "noopener,noreferrer")
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Could not open document")
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(target: Document) {
    setBusyId(target.id)
    onError?.(null)
    try {
      if (live && isPersistedDocumentId(target.id)) {
        const result = await clearDocumentFile(target.id)
        emit(result.application.documents)
      } else {
        emit(
          docs.map((doc) =>
            doc.id === target.id ? { ...doc, status: "missing", originalName: undefined, fileSize: undefined } : doc,
          ),
        )
      }
      setPendingDelete(null)
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Could not remove document")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className={cn(framed && "overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-border/60")}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2.5">
          <FolderOpen className="size-5 text-muted-foreground" />
          <h2 className="text-base font-semibold text-foreground">Supporting Documents</h2>
          <HelpHint articleId="valid-photos" label="What a valid document photo looks like" />
        </div>
        <span className={cn("status-badge", cardBadgeClass[progress.cardStatus])}>
          {progress.cardStatus}
        </span>
      </div>

      <ul className="divide-y divide-border">
        {progress.slots.map((doc) => {
          const filled = isFilledDocumentStatus(doc.status)
          const rejected = doc.status === "rejected"
          const persisted = isPersistedDocumentId(doc.id)
          const problem = !filled && doc.required !== false
          const locked = readOnly || !canAgentChangeDocument(applicationStatus, doc.required !== false)
          const meta = filled && doc.originalName
            ? `${doc.originalName}${doc.fileSize ? ` - ${formatBytes(doc.fileSize)}` : ""}`
            : rejected
              ? doc.reason || "Required document missing."
              : doc.required === false
                ? "Optional"
                : "Required — not uploaded"
          return (
            <li
              key={doc.type}
              id={`document-slot-${doc.type}`}
              className={cn(
                "flex flex-col gap-2 px-5 py-3.5",
                problem && "bg-destructive/10 ring-1 ring-inset ring-destructive/40",
              )}
            >
              <div className="flex items-center gap-3">
              <DocumentExampleThumb type={doc.type} />
              {filled ? (
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success text-white">
                  <Check className="size-3.5" />
                </span>
              ) : rejected ? (
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-destructive text-white">
                  <AlertTriangle className="size-3.5" />
                </span>
              ) : problem ? (
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-destructive text-white">
                  <AlertTriangle className="size-3.5" />
                </span>
              ) : (
                <span className="size-6 shrink-0 rounded-full border-2 border-muted-foreground/30" />
              )}

              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-medium", problem ? "text-destructive" : "text-foreground")}>
                  {doc.name}
                  {doc.required !== false ? <span className="text-destructive"> *</span> : null}
                </p>
                <p className={cn("truncate text-xs", problem ? "text-destructive" : "text-muted-foreground")}>{meta}</p>
              </div>

              {filled ? (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`View ${doc.name}`}
                    disabled={busyId === doc.id}
                    onClick={() => void handleView(doc)}
                  >
                    {busyId === doc.id ? <Loader2 className="size-3.5 animate-spin" /> : <Eye className="size-3.5" />}
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Replace ${doc.name}`}
                    disabled={locked}
                    onClick={() => void openUpload(doc.type)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Remove ${doc.name}`}
                    disabled={locked || (live && !persisted)}
                    onClick={() => setPendingDelete(doc)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                  <span className="ml-1 hidden text-xs text-muted-foreground sm:inline">Uploaded</span>
                </div>
              ) : (
                <div className="flex shrink-0 items-center gap-2">
                  {rejected ? (
                    <Badge variant="destructive" className="uppercase">
                      Rejected
                    </Badge>
                  ) : (
                    <Badge variant={problem ? "destructive" : "outline"} className="uppercase">
                      {problem ? "Missing" : "Optional"}
                    </Badge>
                  )}
                  <Button size="sm" variant="outline" disabled={locked} onClick={() => void openUpload(doc.type)}>
                    <Upload data-icon="inline-start" />
                    Upload
                  </Button>
                </div>
              )}
              </div>
              {rejected ? <RejectedDocumentHelp /> : null}
            </li>
          )
        })}
      </ul>

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this file?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `${pendingDelete.name} will be cleared from this application. You can upload a new file afterwards.`
                : "This file will be removed from the application."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (pendingDelete) void handleDelete(pendingDelete)
              }}
            >
              Remove file
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DocumentUploadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        applicationId={appId}
        documents={docs}
        initialType={activeType}
        live={live}
        onApplicationReady={(application) => {
          setAppId(application.id)
          onApplicationReady?.(application)
          if (application.documents.length) emit(application.documents)
        }}
        onComplete={(next, verification) => {
          emit(next)
          if (verification && !verification.passed) {
            onError?.(`Uploaded, but flagged for review: ${verification.issues.join(". ")}`)
          } else {
            onError?.(null)
          }
        }}
      />
    </div>
  )
}
