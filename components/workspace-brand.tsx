"use client"

import { PanelLeft, PanelLeftClose, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

export function WorkspaceBrand({
  collapsed,
  onToggle,
  subtitle,
}: {
  collapsed: boolean
  onToggle: () => void
  subtitle: string
}) {
  return (
    <div className={cn("shrink-0", collapsed ? "px-2 pt-3" : "px-3 pt-3")}>
      <div
        className={cn(
          "flex items-center rounded-2xl bg-sidebar-accent/70 ring-1 ring-sidebar-border",
          collapsed ? "flex-col gap-2 p-1.5" : "gap-2 p-1.5 pr-1.5",
        )}
      >
        {collapsed ? (
          <span className="flex size-8 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <Zap className="size-4" fill="currentColor" />
          </span>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-2.5 px-1">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
              <Zap className="size-4" fill="currentColor" />
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">Kinetic</p>
              <p className="truncate text-[11px] text-sidebar-foreground/50">{subtitle}</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          className="flex size-8 shrink-0 items-center justify-center rounded-xl text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>
      </div>
    </div>
  )
}
