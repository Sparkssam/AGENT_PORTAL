"use client"

import { useState } from "react"
import { CheckCircle2, Eye, FileText, ImageIcon, RefreshCw, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DocumentStatusLabel } from "@/components/admin/status-badge"
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
        return (
          <div key={doc.id} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
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
              {doc.status !== "missing" && (
                <span className="flex size-6 items-center justify-center rounded-full bg-success/15 text-success">
                  <CheckCircle2 className="size-3.5" />
                </span>
              )}
            </div>

            {doc.verifiedBy && <p className="text-xs text-muted-foreground">Verified by {doc.verifiedBy}</p>}

            <div className="mt-auto flex gap-2 pt-1">
              {doc.status === "missing" ? (
                <Button size="sm" className="flex-1" onClick={() => markUploaded(doc.id)}>
                  <Upload data-icon="inline-start" />
                  Upload
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
