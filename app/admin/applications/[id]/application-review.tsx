"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Printer,
  Share2,
  ClipboardCopy,
  Check,
  Download,
  FileText,
  MapPin,
  ImageOff,
  CheckCircle2,
  XCircle,
  ClipboardList,
  FileCheck2,
  Wallet,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { PageBackLink } from "@/components/page-back-link"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldLabel } from "@/components/ui/field"
import { AppStatusBadge, DepositStatusBadge } from "@/components/admin/status-badge"
import { CaseHealthCard } from "@/components/case-health-card"
import { ApplicationThread } from "@/components/applications/application-thread"
import { DetailField } from "@/components/admin/detail-field"
import {
  buildDocumentFileName,
  getDocumentFile,
  statusLabels,
  type Application,
  type AppStatus,
  type Document,
  type DuplicateMatch,
} from "@/lib/domain"
import { formatCurrencyTZS } from "@/lib/format"
import { downloadFile } from "@/lib/download"
import { formatDateLong, formatGps, formatPhoneTZ } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { copyAllPayload } from "@/lib/actions/export"
import { updateStatus, requestCorrection } from "@/lib/actions/applications"
import { verifyDocument, rejectDocument, signedGet } from "@/lib/actions/documents"
import { DocumentUploadDialog } from "@/components/documents/document-upload-dialog"
import { DocumentRejectDialog } from "@/components/documents/document-reject-dialog"
import { DocumentStatusLabel } from "@/components/admin/status-badge"
import { verifyDeposit } from "@/lib/actions/deposits"

function buildCopyAllDetails(app: Application) {
  return [
    `Agent Name: ${app.agentName}`,
    `Registered Phone: ${formatPhoneTZ(app.phone)}`,
    `Business Sector: ${app.sector}`,
    `Channel: ${app.channel}`,
    `ID Type: ${app.idType}`,
    `ID Number: ${app.idNumber}`,
    `TIN: ${app.tinNumber ?? ""}`,
    `Country: ${app.country}`,
    `Region: ${app.province}`,
    `District: ${app.district}`,
    `Ward: ${app.ward}`,
    `Location: ${app.street}, ${app.houseNumber}`,
    `Latitude: ${app.lat?.toFixed?.(4) ?? app.lat}`,
    `Longitude: ${app.lng?.toFixed?.(4) ?? app.lng}`,
  ].join("\n")
}

const reviewerStatuses: AppStatus[] = ["PENDING_REVIEW", "IN_PROGRESS", "NEEDS_CORRECTION"]
const approverStatuses: AppStatus[] = [...reviewerStatuses, "COMPLETED", "REJECTED"]

const matchLabels: Record<DuplicateMatch["matches"][number], string> = {
  phone: "phone",
  id: "ID number",
  tin: "TIN",
}

export function ApplicationReview({
  application,
  live,
  duplicates = [],
  canFinalize = false,
}: {
  application: Application
  live?: boolean
  duplicates?: DuplicateMatch[]
  canFinalize?: boolean
}) {
  const router = useRouter()
  const [activeDocId, setActiveDocId] = useState(application.documents[0]?.id)
  const [status, setStatus] = useState<AppStatus>(application.status)
  const [copiedAll, setCopiedAll] = useState(false)
  const [copiedShare, setCopiedShare] = useState(false)
  const [correctionNote, setCorrectionNote] = useState("")
  const [rejectionNote, setRejectionNote] = useState("Application does not meet onboarding requirements.")
  const [documentStatuses, setDocumentStatuses] = useState<Record<string, Document["status"]>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [docs, setDocs] = useState(application.documents)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)

  const activeDoc = docs.find((d) => d.id === activeDocId) ?? docs[0]
  const activeDocStatus = activeDoc ? documentStatuses[activeDoc.id] ?? activeDoc.status : "missing"

  const refresh = () => router.refresh()

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update document")
    } finally {
      setBusy(false)
    }
  }

  const handleDownloadDocument = async (doc?: Document) => {
    if (!doc) return
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

  const handleCopyAll = async () => {
    try {
      const text = live ? await copyAllPayload(application.id) : buildCopyAllDetails(application)
      await navigator.clipboard.writeText(text)
      setCopiedAll(true)
      setTimeout(() => setCopiedAll(false), 1800)
    } catch {
      // clipboard unavailable
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: application.appNumber, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopiedShare(true)
      setTimeout(() => setCopiedShare(false), 1800)
    } catch {
      try {
        await navigator.clipboard.writeText(url)
        setCopiedShare(true)
        setTimeout(() => setCopiedShare(false), 1800)
      } catch {
        // share/clipboard unavailable
      }
    }
  }

  const changeStatus = async (next: AppStatus, note?: string) => {
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

  return (
    <div className="absolute inset-0 flex min-h-0 flex-col">
      <div className="portal-page min-h-0 flex-1 overflow-y-auto">
      <PageHeader
        back={<PageBackLink fallback="/admin/applications" label="Back to Applications" />}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {application.appNumber}
            <AppStatusBadge status={status} />
          </span>
        }
        mono
        description={`${application.agentName}${application.businessName ? ` · ${application.businessName}` : ""} · Submitted ${new Date(application.submittedAt).toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer data-icon="inline-start" />
              Print
            </Button>
            <Button onClick={() => void handleShare()}>
              <Share2 data-icon="inline-start" />
              {copiedShare ? "Link copied" : "Share"}
            </Button>
          </div>
        }
      />

      <CaseHealthCard application={application} showNextAction={false} />

      {duplicates.length > 0 && (
        <div className="portal-callout portal-callout-warning flex-col">
          <p className="text-sm font-semibold text-foreground">Possible duplicate applications</p>
          <p className="text-sm text-muted-foreground">
            Matching phone, ID number, or TIN already exists on another case. Review before completing onboarding.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {duplicates.map((dup) => (
              <li key={dup.id}>
                <Link
                  href={`/admin/applications/${dup.id}`}
                  className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {dup.appNumber}
                </Link>
                <span className="text-sm text-muted-foreground">
                  {" "}
                  · {statusLabels[dup.status]} · same {dup.matches.map((match) => matchLabels[match]).join(", ")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-5">
          <section className="portal-table">
            <header className="flex items-center gap-2 border-b border-border px-5 py-4">
              <span className="text-base font-semibold text-foreground">Channel Declaration</span>
            </header>
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 p-5 sm:grid-cols-2">
              <DetailField label="Channel Parent Type" value={application.channelParentType} />
              <DetailField label="Channel Parent Name" value={application.channelParentName} />
              <DetailField label="Channel Manager Type" value={application.channelManagerType} />
              <DetailField label="Channel Manager Name" value={application.channelManagerName} />
              <DetailField label="Channel Tier" value={application.channelType} />
              <DetailField label="Phone Number" value={formatPhoneTZ(application.phone)} mono />
              <DetailField label="Channel Name" value={application.businessName ?? application.channel} />
              <DetailField label="ID Type" value={application.idType} />
              <DetailField label="ID Number" value={application.idNumber} mono />
              <DetailField label="Issued Place" value={application.issuedPlace} />
              <DetailField label="Issued Date" value={formatDateLong(application.issuedDate)} />
              <DetailField
                label="Expire Date"
                value={formatDateLong(application.expireDate)}
                warning={
                  application.expireDate && new Date(application.expireDate) < new Date(Date.now() + 90 * 86400000)
                    ? "Expires Soon"
                    : undefined
                }
              />
            </div>
          </section>

          <section className="portal-table">
            <header className="flex items-center gap-2 border-b border-border px-5 py-4">
              <span className="text-base font-semibold text-foreground">Contact Information</span>
            </header>
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 p-5 sm:grid-cols-2">
              <DetailField label="Email" value={application.email} />
              <DetailField label="Country" value={application.country} />
              <DetailField label="Province" value={application.province} />
              <DetailField label="District" value={application.district} />
              <DetailField label="Ward" value={application.ward} />
              <DetailField label="Street" value={application.street} />
              <DetailField label="House Number" value={application.houseNumber} />
              <DetailField label="Gender" value={application.gender} />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <MapPin className="size-4 text-muted-foreground" />
                <span className="font-mono text-muted-foreground">
                  {formatGps(application.lat, application.lng)}
                </span>
              </div>
              <Button variant="outline" size="sm">
                View on map
              </Button>
            </div>
          </section>

          <section className="portal-table">
            <header className="flex items-center gap-2 border-b border-border px-5 py-4">
              <span className="text-base font-semibold text-foreground">Deposit</span>
              <DepositStatusBadge status={application.depositStatus} className="ml-2" />
            </header>
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 p-5 sm:grid-cols-3">
              <DetailField label="Required Amount" value={formatCurrencyTZS(application.depositAmount)} mono />
              <DetailField label="Reference" value={application.depositReference ?? "Not provided"} mono />
              <DetailField label="Status" value={application.depositStatus} />
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
            <header className="flex items-center justify-between gap-2 border-b border-border px-5 py-4">
              <span className="text-base font-semibold text-foreground">Supporting Documents</span>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-muted-foreground">
                  {docs.length} Files
                </span>
                <Button size="sm" onClick={() => setUploadOpen(true)}>
                  <Upload data-icon="inline-start" />
                  Upload Document
                </Button>
              </div>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr]">
              <ul className="flex flex-row overflow-x-auto border-b border-border sm:flex-col sm:overflow-visible sm:border-b-0 sm:border-r">
                {docs.map((doc) => (
                  <li key={doc.id} className="shrink-0 sm:shrink">
                    <button
                      type="button"
                      onClick={() => setActiveDocId(doc.id)}
                      className={cn(
                        "flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition-colors",
                        activeDoc?.id === doc.id
                          ? "border-l-accent bg-secondary/60"
                          : "border-l-transparent hover:bg-secondary/40",
                      )}
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded bg-muted">
                        {doc.previewUrl ? (
                          <Image
                            src={doc.previewUrl}
                            alt=""
                            width={32}
                            height={32}
                            unoptimized
                            className="size-8 object-cover"
                          />
                        ) : (
                          <FileText className="size-4 text-muted-foreground" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-foreground">{doc.name}</span>
                        <DocumentStatusLabel
                          status={documentStatuses[doc.id] ?? doc.status}
                          required={doc.required}
                          className="block"
                        />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col gap-4 p-5">
                <div className="flex items-center justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!live && !getDocumentFile(activeDoc ?? ({} as Document))}
                    onClick={() => void handleDownloadDocument(activeDoc)}
                  >
                    <Download data-icon="inline-start" />
                    Download
                  </Button>
                </div>
                <div className="flex min-h-64 flex-1 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-secondary/30">
                  {activeDoc?.status === "missing" ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ImageOff className="size-8" />
                      <p className="text-sm">Document not yet uploaded</p>
                    </div>
                  ) : activeDoc?.previewUrl ? (
                    <Image
                      src={activeDoc.previewUrl}
                      alt={activeDoc.name}
                      width={480}
                      height={320}
                      unoptimized
                      className="max-h-72 w-full rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FileText className="size-8" />
                      <p className="text-sm">PDF document — preview unavailable</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-3 rounded-lg border border-border bg-secondary/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{activeDoc?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {activeDocStatus === "verified"
                        ? `Approved${activeDoc?.verifiedBy ? ` by registry staff` : " in this review"}`
                        : activeDocStatus === "rejected"
                          ? activeDoc?.reason ?? "Re-upload requested"
                          : activeDocStatus === "missing"
                            ? "Required — not yet uploaded"
                            : "Pending registry review"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {activeDocStatus !== "missing" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRejectOpen(true)}
                          className="text-destructive hover:text-destructive"
                        >
                          <XCircle data-icon="inline-start" />
                          Request re-upload
                        </Button>
                        <Button size="sm" disabled={busy} onClick={() => void updateDocumentStatus("verified")}>
                          <CheckCircle2 data-icon="inline-start" />
                          Approve
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setUploadOpen(true)}>
                      <Upload data-icon="inline-start" />
                      {activeDocStatus === "rejected" ? "Re-upload" : "Upload"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <Button variant="secondary" className="justify-start" onClick={handleCopyAll}>
            {copiedAll ? <Check data-icon="inline-start" /> : <ClipboardCopy data-icon="inline-start" />}
            {copiedAll ? "Copied to clipboard" : "Copy All Details"}
          </Button>

          <div className="portal-card">
            <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Review Status</p>
            <Select value={status} onValueChange={(v) => void changeStatus(v as AppStatus)} disabled={busy}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {(canFinalize ? approverStatuses : reviewerStatuses)
                    .concat(status === "COMPLETED" || status === "REJECTED" || status === "SUBMITTED" ? [status] : [])
                    .filter((s, i, all) => all.indexOf(s) === i)
                    .map((s) => (
                    <SelectItem key={s} value={s} disabled={!canFinalize && (s === "COMPLETED" || s === "REJECTED")}>
                      {statusLabels[s]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Dialog>
              <DialogTrigger render={<Button variant="outline" className="mt-3 w-full justify-center" />}>
                Request Correction
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request a correction</DialogTitle>
                </DialogHeader>
                <Field>
                  <FieldLabel htmlFor="correction-note">What does the agent need to fix?</FieldLabel>
                  <Textarea
                    id="correction-note"
                    value={correctionNote}
                    onChange={(e) => setCorrectionNote(e.target.value)}
                    placeholder="e.g. Shop image is blurry — please re-upload a clear photo of the storefront."
                    rows={4}
                  />
                </Field>
                <DialogFooter>
                  <Button
                    disabled={busy || correctionNote.trim().length < 3}
                    onClick={async () => {
                      if (live) {
                        setBusy(true)
                        setError(null)
                        try {
                          await requestCorrection(application.id, correctionNote, [
                            { kind: "field", target: "application", reason: correctionNote },
                          ])
                          refresh()
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Could not request correction")
                          setBusy(false)
                          return
                        }
                        setBusy(false)
                      }
                      setStatus("NEEDS_CORRECTION")
                      setCorrectionNote("")
                    }}
                  >
                    Send correction request
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <ApplicationThread applicationId={application.id} live={live} audience="admin" />

          <div className="portal-table">
            <p className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">Activity Timeline</p>
            <ul className="flex flex-col gap-4 p-4">
              {application.timeline.map((event, i) => (
                <li key={event.id} className="flex gap-3">
                  <span className="relative flex flex-col items-center">
                    <span className={cn("size-2 rounded-full", i === 0 ? "bg-accent" : "bg-border")} />
                    {i < application.timeline.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
                  </span>
                  <div className="pb-1">
                    <p className="text-sm font-medium text-foreground">{event.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.actor} · {event.timestamp}
                    </p>
                    {event.detail && <p className="text-xs text-muted-foreground">{event.detail}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>

      <div
        role="region"
        aria-label="Application actions"
        className="relative z-20 shrink-0 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4 md:px-6"
      >
        <div className="mx-auto flex max-w-[1400px] flex-col items-stretch gap-3 rounded-3xl bg-card p-3 shadow-md ring-1 ring-border/60 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-muted-foreground sm:gap-3">
            {error && <span className="text-destructive">{error}</span>}
            <span>
              Viewing <span className="font-mono font-medium text-foreground">{application.appNumber}</span>
            </span>
            <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-foreground">
              {application.fieldsComplete} of {application.fieldsTotal} fields complete
            </span>
            <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-foreground">
              {application.documents.filter((d) => d.status === "verified").length} of {application.documents.length} docs verified
            </span>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
            {canFinalize ? (
              <>
            <AlertDialog>
              <AlertDialogTrigger
                render={<Button variant="outline" className="w-full text-destructive hover:text-destructive sm:w-auto" />}
              >
                Reject Application
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reject this application?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will mark {application.appNumber} as rejected and notify the agent. This action is recorded in the
                    audit timeline.
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
                  <AlertDialogAction onClick={() => void changeStatus("REJECTED", rejectionNote)}>Reject Application</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger render={<Button className="w-full sm:w-auto" />}>Approve Application</AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Approve this application?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will mark {application.appNumber} as completed and prepare it for transfer to the external
                    system.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void changeStatus("COMPLETED", "Application approved")}>Approve Application</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
              </>
            ) : (
              <p className="text-xs text-muted-foreground sm:text-right">
                Reviewers can request correction. A final approver verifies or rejects the case.
              </p>
            )}
          </div>
        </div>
      </div>
      <DocumentUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        applicationId={application.id}
        documents={docs}
        initialType={activeDoc?.type}
        live={live}
        onComplete={(next) => {
          setDocs(next)
          const latest = next.find((doc) => doc.type === activeDoc?.type) ?? next[0]
          if (latest) setActiveDocId(latest.id)
        }}
      />
      <DocumentRejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        documentName={activeDoc?.name}
        busy={busy}
        onConfirm={(reason) => updateDocumentStatus("rejected", reason)}
      />
    </div>
  )
}
