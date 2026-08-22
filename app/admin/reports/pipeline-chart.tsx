"use client"

import { Cell, Pie, PieChart } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

const slices = [
  { key: "queue", label: "In queue", color: "var(--chart-4)" },
  { key: "inProgress", label: "In progress", color: "var(--chart-1)" },
  { key: "needsCorrection", label: "Needs correction", color: "var(--warning)" },
  { key: "completed", label: "Verified", color: "var(--chart-3)" },
  { key: "rejected", label: "Rejected", color: "var(--chart-5)" },
] as const

export function PipelineChart({
  submitted,
  pending,
  inProgress,
  needsCorrection,
  completed,
  rejected,
}: {
  submitted: number
  pending: number
  inProgress: number
  needsCorrection: number
  completed: number
  rejected: number
}) {
  const data = [
    { key: "queue", name: "In queue", value: submitted + pending },
    { key: "inProgress", name: "In progress", value: inProgress },
    { key: "needsCorrection", name: "Needs correction", value: needsCorrection },
    { key: "completed", name: "Verified", value: completed },
    { key: "rejected", name: "Rejected", value: rejected },
  ].filter((row) => row.value > 0)

  const total = data.reduce((sum, row) => sum + row.value, 0)
  const config: ChartConfig = Object.fromEntries(
    slices.map((slice) => [slice.key, { label: slice.label, color: slice.color }]),
  )

  if (total === 0) {
    return (
      <div className="portal-empty">
        <p className="portal-empty-title">No pipeline yet</p>
        <p className="portal-empty-copy">Application statuses will show here once cases exist.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative mx-auto aspect-square h-[220px]">
        <ChartContainer config={config} className="h-full w-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={86}
              strokeWidth={3}
              stroke="var(--card)"
              label={({ percent }) => (percent >= 0.08 ? `${Math.round(percent * 100)}%` : "")}
              labelLine={false}
            >
              {data.map((row) => {
                const slice = slices.find((item) => item.key === row.key)
                return <Cell key={row.key} fill={slice?.color ?? "var(--chart-3)"} />
              })}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-mono text-xl font-medium tabular-nums text-foreground">{total.toLocaleString("en-US")}</p>
          <p className="text-[11px] text-muted-foreground">cases</p>
        </div>
      </div>
      <ul className="flex flex-col gap-2">
        {slices.map((slice) => {
          const row = [
            { key: "queue", value: submitted + pending },
            { key: "inProgress", value: inProgress },
            { key: "needsCorrection", value: needsCorrection },
            { key: "completed", value: completed },
            { key: "rejected", value: rejected },
          ].find((item) => item.key === slice.key)
          const value = row?.value ?? 0
          const pct = total === 0 ? 0 : Math.round((value / total) * 100)
          return (
            <li key={slice.key} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-foreground">
                <span className="size-2 rounded-full" style={{ backgroundColor: slice.color }} />
                {slice.label}
              </span>
              <span className="font-mono text-muted-foreground tabular-nums">
                {value.toLocaleString("en-US")} · {pct}%
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
