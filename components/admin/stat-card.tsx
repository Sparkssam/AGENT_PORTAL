import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  tone?: "default" | "warning" | "success" | "destructive" | "accent"
  hint?: string
}

const toneDot: Record<Required<StatCardProps>["tone"], string> = {
  default: "bg-foreground",
  warning: "bg-warning",
  success: "bg-success",
  destructive: "bg-destructive",
  accent: "bg-accent",
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  hint,
}: StatCardProps) {
  return (
    <div className="portal-stat-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("size-1.5 rounded-full", toneDot[tone])} />
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        <Icon className="size-4 text-muted-foreground/60" />
      </div>
      <div>
        <p className="font-mono text-2xl font-medium tabular-nums tracking-tight text-foreground">
          {typeof value === "number" ? value.toLocaleString("en-US") : value}
        </p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  )
}
