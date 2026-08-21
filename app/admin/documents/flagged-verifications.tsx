"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { setVerificationReview, type ClientVerification } from "@/lib/actions/verifications"

export function FlaggedVerifications({
  items,
  onPreview,
}: {
  items: ClientVerification[]
  onPreview?: (documentId: string) => void
}) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)

  async function review(id: string, status: "approved" | "dismissed") {
    setBusyId(id)
    try {
      await setVerificationReview(id, status)
      router.refresh()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Flagged uploads</h2>
        <p className="text-sm text-muted-foreground">
          Automated quality, OCR, or rule checks failed. Preview the file here, then open the application if the case
          itself needs review.
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Agent</th>
              <th className="px-4 py-2.5 font-medium">Document</th>
              <th className="px-4 py-2.5 font-medium">Issues</th>
              <th className="px-4 py-2.5 font-medium">Extracted</th>
              <th className="px-4 py-2.5 font-medium">Confidence</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0 align-top">
                <td className="px-4 py-2.5">
                  <p className="font-medium text-foreground">{item.agentName ?? "Agent"}</p>
                  <p className="text-xs text-muted-foreground">{item.agentEmail}</p>
                </td>
                <td className="px-4 py-2.5">
                  <p className="text-foreground">{item.documentName ?? item.documentType}</p>
                  <Link
                    href={`/admin/applications/${item.applicationId}`}
                    className="font-mono text-xs text-primary hover:underline"
                  >
                    Open case
                  </Link>
                </td>
                <td className="px-4 py-2.5">
                  <ul className="flex flex-col gap-1">
                    {item.issues.map((issue) => (
                      <li key={issue}>
                        <Badge variant="destructive">{issue}</Badge>
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  <p>{item.extracted.fullName ?? "—"}</p>
                  <p className="font-mono text-xs">{item.extracted.idNumber ?? ""}</p>
                  {item.extracted.expiryDate ? <p className="text-xs">Exp {item.extracted.expiryDate}</p> : null}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs">{Math.round(item.confidence * 100)}%</td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap justify-end gap-2">
                    {onPreview ? (
                      <Button size="sm" variant="outline" onClick={() => onPreview(item.documentId)}>
                        <Eye data-icon="inline-start" />
                        Preview
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === item.id}
                      onClick={() => void review(item.id, "dismissed")}
                    >
                      Dismiss
                    </Button>
                    <Button size="sm" disabled={busyId === item.id} onClick={() => void review(item.id, "approved")}>
                      Clear flag
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No flagged document checks right now.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
