"use client"

import { type ReactElement } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function PortalNavHint({
  label,
  collapsed,
  children,
}: {
  label: string
  collapsed: boolean
  children: ReactElement
}) {
  if (!collapsed) return children
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}

export function shortDisplayName(fullName?: string) {
  const parts = (fullName || "User").trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}
