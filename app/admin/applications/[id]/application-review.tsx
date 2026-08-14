"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft,
  Printer,
  Share2,
  ClipboardCopy,
  Check,
  Download,
  FileText,
  MapPin,
  ImageOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { DetailField } from "@/components/admin/detail-field"
import { formatCurrencyTZS, statusLabels, type Application, type AppStatus } from "@/lib/admin-data"
import { cn } from "@/lib/utils"

function buildCopyAllDetails(app: Application) {
  return [
    `Agent Name: ${app.agentName}`,
    `Registered Phone: ${app.phone}`,
    `Business Sector: ${app.sector}`,
    `Channel: ${app.channel}`,
    `ID Type: ${app.idType}`,
    `ID Number: ${app.idNumber}`,
    `TIN: ${app.documents.find((d) => d.type === "tin") ? app.idNumber.slice(0, 9) : "—"}`,
    `Country: ${app.country}`,
    `Region: ${app.province}`,
    `District: ${app.district}`,
    `Ward: ${app.ward}`,
    `Location: ${app.street}, ${app.houseNumber}`,
    `Latitude: ${app.lat}`,
    `Longitude: ${app.lng}`,
  ].join("\n")
}

const reviewStatuses: AppStatus[] = ["PENDING_REVIEW", "IN_PROGRESS", "NEEDS_CORRECTION", "COMPLETED", "REJECTED"]

export function ApplicationReview({ application }: { application: Application }) {
  const [activeDocId, setActiveDocId] = useState(application.documents[0]?.id)
  const [status, setStatus] = useState<AppStatus>(application.status)
  const [copiedAll, setCopiedAll] = useState(false)
  const [correctionNote, setCorrectionNote] = useState("")

  const activeDoc = application.documents.find((d) => d.id === activeDocId) ?? application.documents[0]

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(buildCopyAllDetails(application))
      setCopiedAll(true)
      setTimeout(() => setCopiedAll(false), 1800)
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 p-4 pb-28 md:p-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/admin/applications"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Applications
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-foreground">
              <FileText className="size-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-mono text-xl font-semibold text-foreground">{application.appNumber}</h1>
                <AppStatusBadge status={status} />
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {application.agentName}
                {application.businessName ? ` · ${application.businessName}` : ""} · Submitted{" "}
                {new Date(application.submittedAt).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Printer data-icon="inline-start" />
              Print
            </Button>
            <Button>
              <Share2 data-icon="inline-start" />
              Share
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <section className="rounded-lg border border-border bg-card">
            <header className="flex items-center gap-2 border-b border-border px-5 py-4">
              <span className="text-base font-semibold text-foreground">Channel Declaration</span>
            </header>
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 p-5 sm:grid-cols-2">
              <DetailField label="Channel Parent Type" value={application.channelParentType} />
              <DetailField label="Channel Parent Name" value={application.channelParentName} />
              <DetailField label="Channel Manager Type" value={application.channelManagerType} />
              <DetailField label="Channel Manager Name" value={application.channelManagerName} />
              <DetailField label="Channel Type" value={application.channelType} />
              <DetailField label="Phone Number" value={application.phone} mono />
              <DetailField label="Channel Name" value={application.channel} />
              <DetailField label="ID Type" value={application.idType} />
              <DetailField label="ID Number" value={application.idNumber} mono />
              <DetailField label="Issued Place" value={application.issuedPlace} />
              <DetailField
                label="Issued Date"
                value={new Date(application.issuedDate).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              />
              <DetailField
                label="Expire Date"
                value={new Date(application.expireDate).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
                warning={new Date(application.expireDate) < new Date(Date.now() + 90 * 86400000) ? "Expires Soon" : undefined}
              />
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card">
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
                  Lat: {application.lat}, Lng: {application.lng}
                </span>
              </div>
              <Button variant="outline" size="sm">
                View on map
              </Button>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card">
            <header className="flex items-center gap-2 border-b border-border px-5 py-4">
              <span className="text-base font-semibold text-foreground">Deposit</span>
              <DepositStatusBadge status={application.depositStatus} className="ml-2" />
            </header>
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 p-5 sm:grid-cols-3">
              <DetailField label="Required Amount" value={formatCurrencyTZS(application.depositAmount)} mono />
              <DetailField label="Reference" value={application.depositReference ?? "Not provided"} mono />
              <DetailField label="Status" value={statusLabels[status] === "Rejected" ? "Rejected" : application.depositStatus} />
            </div>
          </section>

          <section className="overflow-hidden rounded-lg border border-border bg-card">
            <header className="flex items-center justify-between gap-2 border-b border-border px-5 py-4">
              <span className="text-base font-semibold text-foreground">Supporting Documents</span>
              <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-muted-foreground">
                {application.documents.length} Files
              </span>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr]">
              <ul className="flex flex-row overflow-x-auto border-b border-border sm:flex-col sm:overflow-visible sm:border-b-0 sm:border-r">
                {application.documents.map((doc) => (
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
                          <Image src={doc.previewUrl} alt="" width={32} height={32} className="size-8 object-cover" />
                        ) : (
                          <FileText className="size-4 text-muted-foreground" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-foreground">{doc.name}</span>
                        <span
                          className={cn(
                            "block text-xs font-medium",
                            doc.status === "verified" && "text-success",
                            doc.status === "unverified" && "text-warning-foreground",
                            doc.status === "missing" && "text-destructive",
                          )}
                        >
                          {doc.status === "verified" ? "Verified" : doc.status === "unverified" ? "Unverified" : "Missing"}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col gap-4 p-5">
                <div className="flex items-center justify-end">
                  <Button variant="outline" size="sm" disabled={activeDoc?.status === "missing"}>
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
                      className="max-h-72 w-full rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FileText className="size-8" />
                      <p className="text-sm">PDF document — preview unavailable</p>
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">{activeDoc?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {activeDoc?.verifiedBy ? `Verified by ${activeDoc.verifiedBy}` : "Awaiting verification"}
                  </p>
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

          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Review Status</p>
            <Select value={status} onValueChange={(v) => setStatus(v as AppStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {reviewStatuses.map((s) => (
                    <SelectItem key={s} value={s}>
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
                    onClick={() => {
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

          <div className="rounded-lg border border-border bg-card">
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

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur md:left-64">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-3 px-4 py-3 sm:flex-row sm:justify-between md:px-6">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
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
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger
                render={<Button variant="outline" className="text-destructive hover:text-destructive" />}
              >
                Reject Application
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reject this application?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will mark {application.appNumber} as rejected and notify the agent. This action is recorded in the
                    audit timeline and can be reversed by a Super Admin.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => setStatus("REJECTED")}>Reject Application</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger render={<Button />}>Approve Application</AlertDialogTrigger>
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
                  <AlertDialogAction onClick={() => setStatus("COMPLETED")}>Approve Application</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  )
}
