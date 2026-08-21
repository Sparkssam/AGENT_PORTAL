"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"

export function DetailField({
  label,
  value,
  mono = false,
  warning,
}: {
  label: string
  value: string
  mono?: boolean
  warning?: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable — ignore silently
    }
  }

  return (
    <div className="group flex flex-col gap-1">
      <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</span>
      <div className="flex items-center gap-2">
        <span className={cn("text-sm text-foreground", mono && "font-mono")}>{value || "—"}</span>
        {warning && (
          <span className="status-badge status-badge-warning">
            {warning}
          </span>
        )}
        <button
          type="button"
          onClick={handleCopy}
          className="ml-auto flex size-8 items-center justify-center rounded-full text-muted-foreground/0 transition-colors group-hover:text-muted-foreground hover:bg-secondary hover:!text-foreground focus-visible:text-foreground"
          aria-label={`Copy ${label}`}
        >
          {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
        </button>
      </div>
    </div>
  )
}
