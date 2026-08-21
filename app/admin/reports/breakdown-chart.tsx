"use client"

import { Cell, Pie, PieChart } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]

export function BreakdownChart({
  type,
  data,
}: {
  type: "sector" | "channel"
  data: { name: string; value: number; count: number }[]
}) {
  const config: ChartConfig = Object.fromEntries(
    data.map((d, i) => [d.name, { label: d.name, color: colors[i % colors.length] }]),
  )

  return (
    <div className="flex flex-col gap-4">
      <ChartContainer config={config} className="mx-auto aspect-square h-[200px]">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} strokeWidth={2}>
            {data.map((entry, i) => (
              <Cell key={entry.name} fill={colors[i % colors.length]} stroke="var(--card)" />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul className="flex flex-col gap-2">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-foreground">
              <span className="size-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
              {d.name}
            </span>
            <span className="font-mono text-muted-foreground">{d.count.toLocaleString("en-US")}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
