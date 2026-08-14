"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Download, FileText, ImageOff, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import {
  applications,
  buildDocumentFileName,
  getDocumentFile,
  type Document,
  type DocumentStatus,
} from "@/lib/admin-data"
import { downloadFile } from "@/lib/download"
import { cn } from "@/lib/utils"

interface FlatDocument extends Document {
  appId: string
  appNumber: string
  agentName: string
  channel: string
}

const allDocuments: FlatDocument[] = applications.flatMap((app) =>
  app.documents.map((doc) => ({
    ...doc,
    appId: app.id,
    appNumber: app.appNumber,
    agentName: app.agentName,
    channel: app.channel,
  })),
)

function downloadDocument(doc: FlatDocument) {
  const file = getDocumentFile(doc)
  if (!file) return
  const filename = buildDocumentFileName({
    agentName: doc.agentName,
    docName: doc.name,
    network: doc.channel,
    extension: file.extension,
  })
  void downloadFile(file.url, filename)
}

const documentTypeLabels: Record<string, string> = {
  id_front: "ID Card Front",
  id_back: "ID Card Back",
  tin: "TIN Document",
  contract: "Agreement Contract",
  licence: "Business Licence",
  shop_image: "Shop Image",
  portrait: "Portrait",
  other: "Other",
}

function DocStatusBadge({ status }: { status: DocumentStatus }) {
  const styles: Record<DocumentStatus, string> = {
    verified: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
    unverified: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
    rejected: "bg-destructive/10 text-destructive",
    missing: "bg-muted text-muted-foreground",
  }
  const labels: Record<DocumentStatus, string> = {
    verified: "Verified",
    unverified: "Pending",
    rejected: "Rejected",
    missing: "Missing",
  }
  return <Badge className={cn("border-0 font-medium", styles[status])}>{labels[status]}</Badge>
}

const PAGE_SIZE = 8

export function DocumentsTable() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [type, setType] = useState("all")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<FlatDocument | null>(null)

  const types = useMemo(() => Array.from(new Set(allDocuments.map((d) => d.type))), [])

  const filtered = useMemo(() => {
    return allDocuments.filter((doc) => {
      const matchesSearch =
        search.trim() === "" ||
        doc.name.toLowerCase().includes(search.toLowerCase()) ||
        doc.appNumber.toLowerCase().includes(search.toLowerCase()) ||
        doc.agentName.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = status === "all" || doc.status === status
      const matchesType = type === "all" || doc.type === type
      return matchesSearch && matchesStatus && matchesType
    })
  }, [search, status, type])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const summary = useMemo(() => {
    return {
      total: allDocuments.length,
      verified: allDocuments.filter((d) => d.status === "verified").length,
      pending: allDocuments.filter((d) => d.status === "unverified").length,
      rejected: allDocuments.filter((d) => d.status === "rejected").length,
      missing: allDocuments.filter((d) => d.status === "missing").length,
    }
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { label: "Total documents", value: summary.total, cls: "text-foreground" },
          { label: "Verified", value: summary.verified, cls: "text-success" },
          { label: "Pending", value: summary.pending, cls: "text-warning-foreground" },
          { label: "Rejected", value: summary.rejected, cls: "text-destructive" },
          { label: "Missing", value: summary.missing, cls: "text-muted-foreground" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={cn("mt-1 font-mono text-xl font-semibold", s.cls)}>{s.value.toLocaleString("en-US")}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search by document, agent, or application..."
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v ?? "all")
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full md:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="unverified">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="missing">Missing</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          value={type}
          onValueChange={(v) => {
            setType(v ?? "all")
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Document type" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All types</SelectItem>
              {types.map((t) => (
                <SelectItem key={t} value={t}>
                  {documentTypeLabels[t] ?? t}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Document</th>
              <th className="px-4 py-3 font-medium">Application</th>
              <th className="px-4 py-3 font-medium">Agent</th>
              <th className="px-4 py-3 font-medium">Verified by</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Download</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((doc) => (
              <tr
                key={`${doc.appId}-${doc.id}`}
                onClick={() => setSelected(doc)}
                className="cursor-pointer border-b border-border last:border-0 hover:bg-secondary/40"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <FileText className="size-4 text-muted-foreground" />
                    {doc.name}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/applications/${doc.appId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-mono text-xs text-primary hover:underline"
                  >
                    {doc.appNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{doc.agentName}</td>
                <td className="px-4 py-3 text-muted-foreground">{doc.verifiedBy ?? "—"}</td>
                <td className="px-4 py-3">
                  <DocStatusBadge status={doc.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!getDocumentFile(doc)}
                    onClick={(e) => {
                      e.stopPropagation()
                      downloadDocument(doc)
                    }}
                  >
                    <Download data-icon="inline-start" />
                    Download
                  </Button>
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No documents match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          Showing {paged.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}{" "}
          of {filtered.length}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </div>

      <Sheet open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
                <SheetDescription>
                  Submitted for {selected.appNumber} by {selected.agentName}
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-4 px-4">
                <div className="flex aspect-4/3 items-center justify-center overflow-hidden rounded-lg border border-border bg-secondary/40">
                  {selected.fileType === "image" && selected.previewUrl ? (
                    <Image
                      src={selected.previewUrl || "/placeholder.svg"}
                      alt={selected.name}
                      width={400}
                      height={300}
                      className="h-full w-full object-cover"
                      crossOrigin="anonymous"
                    />
                  ) : selected.fileType === "pdf" ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FileText className="size-10" />
                      <span className="text-xs">PDF document</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ImageOff className="size-10" />
                      <span className="text-xs">No preview available</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <div className="mt-1">
                      <DocStatusBadge status={selected.status} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Verified by</p>
                    <p className="mt-1 text-foreground">{selected.verifiedBy ?? "Not yet verified"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">File type</p>
                    <p className="mt-1 uppercase text-foreground">{selected.fileType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Document type</p>
                    <p className="mt-1 text-foreground">{documentTypeLabels[selected.type] ?? selected.type}</p>
                  </div>
                </div>
                {selected.status === "rejected" && selected.reason && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
                    <p className="text-xs font-medium text-destructive">Rejection reason</p>
                    <p className="mt-0.5 text-sm text-destructive/90">{selected.reason}</p>
                  </div>
                )}
              </div>
              <SheetFooter className="gap-2">
                {selected.status !== "missing" && (
                  <div className="grid w-full grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setSelected({ ...selected, status: "rejected", reason: "Marked for correction during review" })}
                    >
                      Reject
                    </Button>
                    <Button onClick={() => setSelected({ ...selected, status: "verified", verifiedBy: "Admin User" })}>
                      Verify document
                    </Button>
                  </div>
                )}
                {getDocumentFile(selected) && (
                  <Button
                    variant="secondary"
                    className="w-full justify-center"
                    onClick={() => downloadDocument(selected)}
                  >
                    <Download data-icon="inline-start" />
                    Download document
                  </Button>
                )}
                <Button
                  variant="outline"
                  render={<Link href={`/admin/applications/${selected.appId}`} />}
                  className="w-full justify-center"
                >
                  Open full case
                </Button>
                <SheetClose render={<Button variant="outline" className="w-full justify-center" />}>
                  Close
                </SheetClose>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
