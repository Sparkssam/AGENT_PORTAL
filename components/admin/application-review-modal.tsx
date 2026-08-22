"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  CheckCircle2,
  Clock,
  CircleDashed,
  XCircle,
  Download,
  FileText,
  ImageOff,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Pin,
  PinOff,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AppStatusBadge, DepositStatusBadge, DocumentStatusLabel } from "@/components/admin/status-badge"
import { DetailField } from "@/components/admin/detail-field"
import { DocumentRejectDialog } from "@/components/documents/document-reject-dialog"
import {
  buildDocumentFileName,
  getDocumentFile,
  statusLabels,
  type Application,
  type AppStatus,
  type Document,
  type DocumentStatus,
  type DuplicateMatch,
} from "@/lib/domain"
import { formatDateLong, formatGps, formatPhoneTZ } from "@/lib/format"
import { downloadFile } from "@/lib/download"
import { cn } from "@/lib/utils"
import { findDuplicates, getApplication, updateStatus } from "@/lib/actions/applications"
import { rejectDocument, signedGet, verifyDocument } from "@/lib/actions/documents"
import { verifyDeposit } from "@/lib/actions/deposits"
import { useRouter } from "next/navigation"

const docStatusMeta: Record<
  DocumentStatus,
  { icon: typeof CheckCircle2; iconCls: string; label: string }
> = {
  verified: { icon: CheckCircle2, iconCls: "text-success", label: "Accepted" },
  unverified: { icon: Clock, iconCls: "text-muted-foreground", label: "Pending review" },
  rejected: { icon: XCircle, iconCls: "text-destructive", label: "Rejected" },
  missing: { icon: CircleDashed, iconCls: "text-muted-foreground", label: "Required" },
}

const matchLabels: Record<DuplicateMatch["matches"][number], string> = {
  phone: "phone",
  id: "ID number",
  tin: "TIN",
}

function resolveDocStatus(doc: Document, overrides: Record<string, DocumentStatus>) {
  return overrides[doc.id] ?? doc.status
}

function DocumentPreview({
  doc,
  status,
  zoom,
  rotation,
  live,
  onPreviewError,
}: {
  doc: Document | undefined
  status: DocumentStatus
  zoom: number
  rotation: number
  live: boolean
  onPreviewError: () => void
}) {
  const [loading, setLoading] = useState(Boolean(doc?.previewUrl && status !== "missing"))

  useEffect(() => {
    setLoading(Boolean(doc?.previewUrl && status !== "missing"))
  }, [doc?.id, doc?.previewUrl, status])

  if (!doc) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
        <FileText className="size-8" />
        <p className="text-sm">Select a document to preview</p>
      </div>
    )
  }

  if (status === "missing") {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
        <ImageOff className="size-8" />
        <p className="text-sm">Document not yet uploaded</p>
      </div>
    )
  }

  if (doc.fileType === "pdf" && !doc.previewUrl) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
        <FileText className="size-8" />
        <p className="text-sm">PDF document — preview unavailable</p>
        <p className="text-xs">Use download to open the original file.</p>
      </div>
    )
  }

  if (!doc.previewUrl) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-8 animate-spin" />
        <p className="text-sm">{live ? "Loading preview…" : "Preview unavailable"}</p>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-80 items-center justify-center rounded-lg border border-dashed border-border bg-secondary/30">
      {loading ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-secondary/40 text-muted-foreground">
          <Loader2 className="size-8 animate-spin" />
          <p className="text-sm">Loading preview…</p>
        </div>
      ) : null}
      <Image
        src={doc.previewUrl}
        alt={doc.name}
        width={960}
        height={640}
        className="max-h-full max-w-full rounded-md object-contain transition-transform duration-200"
        style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false)
          onPreviewError()
        }}
      />
    </div>
  )
}

function PinnedPreview({
  doc,
  status,
  onUnpin,
}: {
  doc: Document
  status: DocumentStatus
  onUnpin: () => void
}) {
  const [broken, setBroken] = useState(false)

  return (
    <aside className="flex w-full shrink-0 flex-col gap-2 border-t border-border bg-secondary/20 p-3 lg:w-72 lg:border-t-0 lg:border-l">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-semibold text-foreground">Pinned: {doc.name}</p>
        <Button variant="ghost" size="icon-sm" onClick={onUnpin} aria-label="Unpin document">
          <PinOff />
        </Button>
      </div>
      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
        {status === "missing" || broken || !doc.previewUrl ? (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <ImageOff className="size-5" />
            <p className="text-xs">No preview</p>
          </div>
        ) : (
          <Image
            src={doc.previewUrl}
            alt={doc.name}
            width={280}
            height={210}
            className="size-full object-contain"
            onError={() => setBroken(true)}
          />
        )}
      </div>
      <DocumentStatusLabel status={status} required={doc.required} className="w-fit" />
    </aside>
  )
}

export function ApplicationReviewModal({
  applicationId,
  open,
  onOpenChange,
  live = false,
  initialApplication,
}: {
  applicationId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  live?: boolean
  initialApplication?: Application
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [application, setApplication] = useState<Application | null>(initialApplication ?? null)
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([])
  const [tab, setTab] = useState("information")
  const [activeDocId, setActiveDocId] = useState<string | undefined>()
  const [pinnedDocId, setPinnedDocId] = useState<string | null>(null)
  const [documentStatuses, setDocumentStatuses] = useState<Record<string, DocumentStatus>>({})
  const [docs, setDocs] = useState<Document[]>([])
  const [status, setStatus] = useState<AppStatus>("PENDING_REVIEW")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectionNote, setRejectionNote] = useState("Application does not meet onboarding requirements.")
  const [previewBroken, setPreviewBroken] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  const resetSession = useCallback(() => {
    setTab("information")
    setPinnedDocId(null)
    setActiveDocId(undefined)
    setDocumentStatuses({})
    setPreviewBroken(false)
    setZoom(1)
    setRotation(0)
    setError(null)
    setLoadError(null)
    setRejectOpen(false)
  }, [])

  useEffect(() => {
    if (!open || !applicationId) return

    let cancelled = false
    setLoading(true)
    setLoadError(null)

    if (initialApplication?.id === applicationId) {
      setApplication(initialApplication)
      setDocs(initialApplication.documents)
      setStatus(initialApplication.status)
      setActiveDocId(initialApplication.documents[0]?.id)
    }

    void getApplication(applicationId)
      .then(async (app) => {
        const dups = await findDuplicates({
          phone: app.phone,
          idNumber: app.idNumber,
          tinNumber: app.tinNumber,
          excludeId: applicationId,
        }).catch(() => [] as DuplicateMatch[])
        return { app, dups }
      })
      .then(({ app, dups }) => {
        if (cancelled) return
        setApplication(app)
        setDocs(app.documents)
        setStatus(app.status)
        setActiveDocId((current) => current ?? app.documents[0]?.id)
        setDuplicates(dups)
      })
      .catch((err) => {
        if (cancelled) return
        if (initialApplication?.id === applicationId) {
          setApplication(initialApplication)
          setDocs(initialApplication.documents)
          setStatus(initialApplication.status)
          setActiveDocId(initialApplication.documents[0]?.id)
        } else {
          setLoadError(err instanceof Error ? err.message : "Could not load application")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, applicationId, initialApplication])

  useEffect(() => {
    if (!open) resetSession()
  }, [open, resetSession])

  const activeDoc = docs.find((d) => d.id === activeDocId) ?? docs[0]
  const pinnedDoc = pinnedDocId ? docs.find((d) => d.id === pinnedDocId) : undefined
  const activeDocStatus = activeDoc ? resolveDocStatus(activeDoc, documentStatuses) : "missing"
  const pendingDocs = useMemo(
    () => docs.filter((doc) => resolveDocStatus(doc, documentStatuses) === "unverified"),
    [docs, documentStatuses],
  )

  const refresh = () => router.refresh()

  const handleDownloadDocument = async (doc?: Document) => {
    if (!doc || !application) return
    if (live) {
      try {
        const signed = await signedGet(doc.id, "attachment")
        void downloadFile(signed.getUrl, signed.filename ?? `${doc.name}.png`)
        return
      } catch {
        // fall through
      }
    }
    const file = getDocumentFile(doc)
    if (!file) return
    const filename = buildDocumentFileName({
      agentName: application.agentName,
      docName: doc.name,
      network: application.channel,
      extension: file.extension,
    })
    void downloadFile(file.url, filename)
  }

  const handleExpand = async (doc?: Document) => {
    if (!doc) return
    if (live) {
      try {
        const signed = await signedGet(doc.id, "inline")
        window.open(signed.getUrl, "_blank", "noopener,noreferrer")
        return
      } catch {
        // fall through
      }
    }
    const file = getDocumentFile(doc)
    if (file?.url) window.open(file.url, "_blank", "noopener,noreferrer")
  }

  const updateDocumentStatus = async (nextStatus: "verified" | "rejected", reason?: string) => {
    if (!activeDoc) return
    setDocumentStatuses((current) => ({ ...current, [activeDoc.id]: nextStatus }))
    setDocs((current) =>
      current.map((doc) =>
        doc.id === activeDoc.id ? { ...doc, status: nextStatus, reason: reason ?? doc.reason } : doc,
      ),
    )
    if (!live) return
    setBusy(true)
    setError(null)
    try {
      if (nextStatus === "verified") await verifyDocument(activeDoc.id)
      else await rejectDocument(activeDoc.id, reason?.trim() || "Please re-upload this document")
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update document")
    } finally {
      setBusy(false)
    }
  }

  const approveAllPending = async () => {
    if (!pendingDocs.length) return
    setBusy(true)
    setError(null)
    const nextStatuses = { ...documentStatuses }
    try {
      for (const doc of pendingDocs) {
        nextStatuses[doc.id] = "verified"
        if (live) await verifyDocument(doc.id)
      }
      setDocumentStatuses(nextStatuses)
      setDocs((current) => current.map((doc) => (nextStatuses[doc.id] === "verified" ? { ...doc, status: "verified" } : doc)))
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not approve all documents")
    } finally {
      setBusy(false)
    }
  }

  const changeStatus = async (next: AppStatus, note?: string) => {
    if (!application) return
    setStatus(next)
    if (!live) return
    setBusy(true)
    setError(null)
    try {
      await updateStatus(application.id, next, note)
      refresh()
    } catch (err) {
      setStatus(application.status)
      setError(err instanceof Error ? err.message : "Could not update status")
    } finally {
      setBusy(false)
    }
  }

  const locationLabel = application
    ? [application.street, application.houseNumber].filter(Boolean).join(", ") || "—"
    : "—"

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          onOpenChange(next)
          if (!next) resetSession()
        }}
      >
        <DialogContent
          showCloseButton
          scrollBehavior="viewport"
          className="gap-0"
          aria-describedby={undefined}
        >
          {loading && !application ? (
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-8 text-muted-foreground">
              <Loader2 className="size-8 animate-spin" />
              <p className="text-sm">Loading application…</p>
            </div>
          ) : loadError && !application ? (
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-8">
              <AlertTriangle className="size-8 text-destructive" />
              <p className="text-sm text-destructive">{loadError}</p>
            </div>
          ) : application ? (
            <>
              <header className="border-b border-border px-5 py-4 pr-14">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <DialogTitle className="flex flex-wrap items-center gap-2 text-lg font-semibold">
                      <span className="font-mono">{application.appNumber}</span>
                      <AppStatusBadge status={status} />
                      <DepositStatusBadge status={application.depositStatus} />
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                      {application.agentName}
                      {application.businessName ? ` · ${application.businessName}` : ""}
                    </DialogDescription>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Per-document review updates individual files. Application approve/reject sets overall{" "}
                    <span className="font-medium text-foreground">App Status</span> independently.
                  </p>
                </div>
              </header>

              <Tabs value={tab} onValueChange={(value) => setTab(value ?? "information")} className="gap-0">
                <div className="border-b border-border px-5 py-3">
                  <TabsList variant="line" className="w-full justify-start sm:w-auto">
                    <TabsTrigger value="information">Information</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="information">
                  <div className={cn("flex flex-col lg:flex-row", pinnedDoc && "lg:divide-x lg:divide-border")}>
                    <div className="min-w-0 flex-1 space-y-5 p-5">
                      {duplicates.length > 0 && (
                        <div className="portal-callout portal-callout-warning flex-col">
                          <p className="text-sm font-semibold text-foreground">Possible duplicate applications</p>
                          <ul className="mt-2 flex flex-col gap-1">
                            {duplicates.map((dup) => (
                              <li key={dup.id} className="text-sm text-muted-foreground">
                                <Link href={`/admin/applications/${dup.id}`} className="font-medium text-foreground hover:underline">
                                  {dup.appNumber}
                                </Link>
                                {" · "}
                                {statusLabels[dup.status]} · same{" "}
                                {dup.matches.map((match) => matchLabels[match]).join(", ")}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <section className="portal-table">
                        <header className="border-b border-border px-5 py-3">
                          <span className="text-sm font-semibold text-foreground">Identity & contact</span>
                        </header>
                        <div className="grid grid-cols-1 gap-x-8 gap-y-5 p-5 sm:grid-cols-2">
                          <DetailField label="Full Name" value={application.agentName} />
                          <DetailField label="Phone" value={formatPhoneTZ(application.phone)} mono />
                          <DetailField label="Email" value={application.email} />
                          <DetailField label="Gender" value={application.gender} />
                        </div>
                      </section>

                      <section className="portal-table">
                        <header className="border-b border-border px-5 py-3">
                          <span className="text-sm font-semibold text-foreground">Channel & agent hierarchy</span>
                        </header>
                        <div className="grid grid-cols-1 gap-x-8 gap-y-5 p-5 sm:grid-cols-2">
                          <DetailField label="Channel Name" value={application.businessName ?? application.channel} />
                          <DetailField label="Sector" value={application.sector} />
                          <DetailField label="Channel" value={application.channel} />
                          <DetailField label="Channel Parent Type" value={application.channelParentType} />
                          <DetailField label="Channel Parent Name" value={application.channelParentName} />
                          <DetailField label="Channel Manager Type" value={application.channelManagerType} />
                          <DetailField label="Channel Manager Name" value={application.channelManagerName} />
                          <DetailField label="Channel Tier" value={application.channelType} />
                        </div>
                      </section>

                      <section className="portal-table">
                        <header className="border-b border-border px-5 py-3">
                          <span className="text-sm font-semibold text-foreground">ID document</span>
                        </header>
                        <div className="grid grid-cols-1 gap-x-8 gap-y-5 p-5 sm:grid-cols-2">
                          <DetailField label="ID Type" value={application.idType} />
                          <DetailField label="ID Number" value={application.idNumber} mono />
                          <DetailField label="Issued Place" value={application.issuedPlace} />
                          <DetailField label="Issued Date" value={formatDateLong(application.issuedDate)} />
                          <DetailField
                            label="Expiry Date"
                            value={formatDateLong(application.expireDate)}
                            warning={
                              application.expireDate &&
                              new Date(application.expireDate) < new Date(Date.now() + 90 * 86400000)
                                ? "Expires Soon"
                                : undefined
                            }
                          />
                        </div>
                      </section>

                      <section className="portal-table">
                        <header className="border-b border-border px-5 py-3">
                          <span className="text-sm font-semibold text-foreground">Location</span>
                        </header>
                        <div className="grid grid-cols-1 gap-x-8 gap-y-5 p-5 sm:grid-cols-2">
                          <DetailField label="Ward" value={application.ward} />
                          <DetailField label="House/Plot Number" value={application.houseNumber} mono />
                          <DetailField label="Location" value={locationLabel} />
                          <DetailField label="GPS Coordinates" value={formatGps(application.lat, application.lng)} mono />
                        </div>
                      </section>

                      <section className="portal-table">
                        <header className="flex items-center gap-2 border-b border-border px-5 py-3">
                          <span className="text-sm font-semibold text-foreground">Deposit</span>
                          <DepositStatusBadge status={application.depositStatus} />
                        </header>
                        <div className="grid grid-cols-1 gap-x-8 gap-y-5 p-5 sm:grid-cols-2">
                          <DetailField label="Deposit status" value={application.depositStatus} />
                          <DetailField label="Reference" value={application.depositReference ?? "Not provided"} mono />
                        </div>
                        {live && (
                          <div className="flex gap-2 border-t border-border px-5 py-3">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={busy || application.depositStatus === "REJECTED"}
                              onClick={async () => {
                                setBusy(true)
                                setError(null)
                                try {
                                  await verifyDeposit(application.id, "REJECTED", "Deposit proof was rejected")
                                  const next = await getApplication(application.id)
                                  setApplication(next)
                                  refresh()
                                } catch (err) {
                                  setError(err instanceof Error ? err.message : "Could not reject deposit")
                                } finally {
                                  setBusy(false)
                                }
                              }}
                            >
                              Reject deposit
                            </Button>
                            <Button
                              size="sm"
                              disabled={busy || application.depositStatus === "CLEARED"}
                              onClick={async () => {
                                setBusy(true)
                                setError(null)
                                try {
                                  await verifyDeposit(application.id, "CLEARED")
                                  const next = await getApplication(application.id)
                                  setApplication(next)
                                  refresh()
                                } catch (err) {
                                  setError(err instanceof Error ? err.message : "Could not verify deposit")
                                } finally {
                                  setBusy(false)
                                }
                              }}
                            >
                              Verify deposit
                            </Button>
                          </div>
                        )}
                      </section>

                      <section className="portal-table">
                        <header className="border-b border-border px-5 py-3">
                          <span className="text-sm font-semibold text-foreground">Activity log</span>
                        </header>
                        <ul className="flex flex-col gap-4 p-5">
                          {application.timeline.length === 0 ? (
                            <li className="text-sm text-muted-foreground">No activity recorded yet.</li>
                          ) : (
                            application.timeline.map((event, i) => (
                              <li key={event.id} className="flex gap-3">
                                <span className="relative flex flex-col items-center">
                                  <span className={cn("size-2 rounded-full", i === 0 ? "bg-accent" : "bg-border")} />
                                  {i < application.timeline.length - 1 && (
                                    <span className="mt-1 w-px flex-1 bg-border" />
                                  )}
                                </span>
                                <div className="pb-1">
                                  <p className="text-sm font-medium text-foreground">{event.action}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {event.actor} · {event.timestamp}
                                  </p>
                                  {event.detail ? (
                                    <p className="text-xs text-muted-foreground">{event.detail}</p>
                                  ) : null}
                                </div>
                              </li>
                            ))
                          )}
                        </ul>
                      </section>
                    </div>

                    {pinnedDoc ? (
                      <PinnedPreview
                        doc={pinnedDoc}
                        status={resolveDocStatus(pinnedDoc, documentStatuses)}
                        onUnpin={() => setPinnedDocId(null)}
                      />
                    ) : null}
                  </div>
                </TabsContent>

                <TabsContent value="documents">
                  <div className="flex flex-col">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
                      <p className="text-sm text-muted-foreground">
                        {docs.filter((d) => resolveDocStatus(d, documentStatuses) === "verified").length} of {docs.length}{" "}
                        documents approved
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy || pendingDocs.length === 0}
                        onClick={() => void approveAllPending()}
                      >
                        <CheckCircle2 data-icon="inline-start" />
                        Approve all pending{pendingDocs.length ? ` (${pendingDocs.length})` : ""}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr]">
                      <div className="hidden border-b border-border lg:block lg:border-b-0 lg:border-r">
                        <ul className="flex flex-col">
                          {docs.map((doc) => {
                            const docStatus = resolveDocStatus(doc, documentStatuses)
                            const meta = docStatusMeta[docStatus]
                            const Icon = meta.icon
                            const rejected = docStatus === "rejected"
                            return (
                              <li key={doc.id}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDocId(doc.id)
                                    setPreviewBroken(false)
                                    setZoom(1)
                                    setRotation(0)
                                  }}
                                  className={cn(
                                    "flex w-full flex-col gap-1 border-l-2 px-4 py-3 text-left transition-colors",
                                    activeDoc?.id === doc.id
                                      ? "border-l-accent bg-secondary/60"
                                      : "border-l-transparent hover:bg-secondary/40",
                                  )}
                                >
                                  <div className="flex items-start gap-2">
                                    <Icon className={cn("mt-0.5 size-4 shrink-0", meta.iconCls)} />
                                    <span className="min-w-0 flex-1">
                                      <span className="block truncate text-sm font-medium text-foreground">{doc.name}</span>
                                      <span className={cn("text-xs font-medium", meta.iconCls.replace("text-", "text-"))}>
                                        {meta.label}
                                      </span>
                                    </span>
                                  </div>
                                  {rejected && doc.reason ? (
                                    <p className="pl-6 text-xs text-muted-foreground">{doc.reason}</p>
                                  ) : null}
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      </div>

                      <div className="flex flex-col p-5">
                        <div className="mb-4 lg:hidden">
                          <Select
                            value={activeDoc?.id ?? ""}
                            onValueChange={(value) => {
                              setActiveDocId(value ?? undefined)
                              setPreviewBroken(false)
                              setZoom(1)
                              setRotation(0)
                            }}
                          >
                            <SelectTrigger aria-label="Select document">
                              <SelectValue placeholder="Select document" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {docs.map((doc) => (
                                  <SelectItem key={doc.id} value={doc.id}>
                                    {doc.name}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="mb-3 flex flex-wrap items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  variant="outline"
                                  size="icon-sm"
                                  aria-label="Zoom in"
                                  disabled={!activeDoc?.previewUrl || previewBroken}
                                  onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
                                />
                              }
                            >
                              <ZoomIn />
                            </TooltipTrigger>
                            <TooltipContent>Zoom in</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  variant="outline"
                                  size="icon-sm"
                                  aria-label="Zoom out"
                                  disabled={!activeDoc?.previewUrl || previewBroken}
                                  onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
                                />
                              }
                            >
                              <ZoomOut />
                            </TooltipTrigger>
                            <TooltipContent>Zoom out</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  variant="outline"
                                  size="icon-sm"
                                  aria-label="Rotate"
                                  disabled={!activeDoc?.previewUrl || previewBroken}
                                  onClick={() => setRotation((r) => (r + 90) % 360)}
                                />
                              }
                            >
                              <RotateCw />
                            </TooltipTrigger>
                            <TooltipContent>Rotate</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  variant="outline"
                                  size="icon-sm"
                                  aria-label="Expand preview"
                                  disabled={activeDocStatus === "missing"}
                                  onClick={() => void handleExpand(activeDoc)}
                                />
                              }
                            >
                              <Maximize2 />
                            </TooltipTrigger>
                            <TooltipContent>Expand</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  variant="outline"
                                  size="icon-sm"
                                  aria-label="Download original"
                                  disabled={activeDocStatus === "missing"}
                                  onClick={() => void handleDownloadDocument(activeDoc)}
                                />
                              }
                            >
                              <Download />
                            </TooltipTrigger>
                            <TooltipContent>Download original</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  variant="outline"
                                  size="icon-sm"
                                  aria-label={pinnedDocId === activeDoc?.id ? "Unpin document" : "Pin document"}
                                  disabled={!activeDoc || activeDocStatus === "missing"}
                                  onClick={() =>
                                    setPinnedDocId((current) =>
                                      current === activeDoc?.id ? null : (activeDoc?.id ?? null),
                                    )
                                  }
                                />
                              }
                            >
                              {pinnedDocId === activeDoc?.id ? <PinOff /> : <Pin />}
                            </TooltipTrigger>
                            <TooltipContent>
                              {pinnedDocId === activeDoc?.id ? "Unpin" : "Pin for cross-check on Information tab"}
                            </TooltipContent>
                          </Tooltip>
                        </div>

                        {previewBroken ? (
                          <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            Preview failed to load. Try downloading the original file.
                          </div>
                        ) : null}

                        <DocumentPreview
                          doc={activeDoc}
                          status={activeDocStatus}
                          zoom={zoom}
                          rotation={rotation}
                          live={live}
                          onPreviewError={() => setPreviewBroken(true)}
                        />

                        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-border bg-secondary/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">{activeDoc?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {activeDocStatus === "verified"
                                ? "Accepted"
                                : activeDocStatus === "rejected"
                                  ? activeDoc?.reason ?? "Re-upload requested"
                                  : activeDocStatus === "missing"
                                    ? "Required — not yet uploaded"
                                    : "Pending review"}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {activeDocStatus !== "missing" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setRejectOpen(true)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <XCircle data-icon="inline-start" />
                                  Reject
                                </Button>
                                <Button size="sm" disabled={busy} onClick={() => void updateDocumentStatus("verified")}>
                                  <CheckCircle2 data-icon="inline-start" />
                                  Approve
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <footer className="border-t border-border bg-card px-5 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    {error ? <span className="text-destructive">{error}</span> : null}
                    <span>
                      {application.fieldsComplete} of {application.fieldsTotal} fields complete
                    </span>
                    <span className="hidden sm:inline">·</span>
                    <span>
                      {docs.filter((d) => resolveDocStatus(d, documentStatuses) === "verified").length} of {docs.length}{" "}
                      docs verified
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={
                          <Button variant="outline" className="text-destructive hover:text-destructive" />
                        }
                      >
                        Reject Application
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reject this application?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Marks {application.appNumber} as rejected. Document statuses are kept for audit; overall App
                            Status becomes Rejected.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <Textarea
                          value={rejectionNote}
                          onChange={(e) => setRejectionNote(e.target.value)}
                          placeholder="Rejection reason"
                          rows={3}
                          className="mx-6 mb-2"
                        />
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => void changeStatus("REJECTED", rejectionNote)}>
                            Reject Application
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                      <AlertDialogTrigger render={<Button />}>Approve Application</AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Approve this application?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Sets App Status to Verified (completed). Ensure required documents and deposit are cleared
                            first — per-document approval does not auto-complete the case.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => void changeStatus("COMPLETED", "Application approved")}>
                            Approve Application
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </footer>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {application ? (
        <DocumentRejectDialog
          open={rejectOpen}
          onOpenChange={setRejectOpen}
          documentName={activeDoc?.name}
          busy={busy}
          onConfirm={(reason) => updateDocumentStatus("rejected", reason)}
        />
      ) : null}
    </>
  )
}

