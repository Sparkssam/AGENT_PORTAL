"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export function WorkspaceIdentity({
  name,
  initials,
  className,
}: {
  name: string
  initials: string
  className?: string
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-2.5 rounded-2xl bg-card py-1 pr-3 pl-1 shadow-sm ring-1 ring-border/60 transition hover:bg-muted/50",
        className,
      )}
    >
      <Avatar className="size-8">
        <AvatarFallback className="bg-primary text-[11px] text-primary-foreground">{initials}</AvatarFallback>
      </Avatar>
      <span className="hidden min-w-0 text-left leading-tight sm:block">
        <span className="block truncate text-sm font-semibold text-foreground">{name}</span>
        <span className="block truncate text-[11px] text-muted-foreground">Kinetic</span>
      </span>
    </span>
  )
}
