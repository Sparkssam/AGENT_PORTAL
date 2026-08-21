"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { applicationsCsv } from "@/lib/actions/export"

export function ExportCsvButton({ live }: { live: boolean }) {
  async function handleExport() {
    if (!live) return
    const csv = await applicationsCsv()
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "applications.csv"
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="outline" onClick={() => void handleExport()} disabled={!live}>
      <Download data-icon="inline-start" />
      Export
    </Button>
  )
}
