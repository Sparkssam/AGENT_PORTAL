"use client"

import { useState } from "react"
import { CheckCircle2, Eye, FileText, ImageIcon, RefreshCw, Upload, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DocumentStatusLabel } from "@/components/admin/status-badge"
import { cn } from "@/lib/utils"
import type { Document } from "@/lib/admin-data"

export function DocumentsManager({ documents }: { documents: Document[] }) {
  const [docs, setDocs] = useState(documents)

  function markUploaded(id: string) {
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, status: "unverified" } : d)))
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {docs.map((doc) => {
        const FileIcon = doc.fileType === "image" ? ImageIcon : FileText
        const needsAction = doc.status === "missing" || doc.status === "rejected"
        return (
          <div
            key={doc.id}
            className={cn(
              "flex flex-col gap-3 rounded-lg border bg-card p-5",
              doc.status === "rejected" ? "border-destructive/40" : "border-border",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                  <FileIcon className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{doc.name}</p>
                  <DocumentStatusLabel status={doc.status} />
                </div>
              </div>
              {doc.status === "verified" && (
                <span className="flex size-6 items-center justify-center rounded-full bg-success/15 text-success">
                  <CheckCircle2 className="size-3.5" />
                </span>
              )}
              {doc.status === "rejected" && (
                <span className="flex size-6 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                  <AlertTriangle className="size-3.5" />
                </span>
              )}
            </div>

            {doc.status === "rejected" && doc.reason && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{doc.reason}</p>
            )}
            {doc.status === "verified" && doc.verifiedBy && (
              <p className="text-xs text-muted-foreground">Verified by {doc.verifiedBy}</p>
            )}

            <div className="mt-auto flex gap-2 pt-1">
              {needsAction ? (
                <Button size="sm" className="flex-1" onClick={() => markUploaded(doc.id)}>
                  <Upload data-icon="inline-start" />
                  {doc.status === "rejected" ? "Re-upload" : "Upload"}
                </Button>
              ) : (
                <>
                  {doc.previewUrl && (
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye data-icon="inline-start" />
                      Preview
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => markUploaded(doc.id)}>
                    <RefreshCw data-icon="inline-start" />
                    Replace
                  </Button>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
