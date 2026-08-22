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
      <span className="flex size-8 items-center justify-center rounded-full bg-primary text-[11px] font-medium text-primary-foreground">
        {initials}
      </span>
      <span className="hidden min-w-0 text-left leading-tight sm:block">
        <span className="block truncate text-sm font-semibold text-foreground">{name}</span>
        <span className="block truncate text-[11px] text-muted-foreground">Kinetic</span>
      </span>
    </span>
  )
}
