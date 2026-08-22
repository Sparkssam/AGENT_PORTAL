"use client"

import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

const palette = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]

export function RankingChart({
  data,
  emptyTitle,
  emptyCopy,
}: {
  data: { name: string; value: number; count: number }[]
  emptyTitle: string
  emptyCopy: string
}) {
  const rows = [...data].sort((a, b) => b.count - a.count)
  const config: ChartConfig = Object.fromEntries(
    rows.map((row, index) => [row.name, { label: row.name, color: palette[index % palette.length] }]),
  )

  if (!rows.length) {
    return (
      <div className="portal-empty">
        <p className="portal-empty-title">{emptyTitle}</p>
        <p className="portal-empty-copy">{emptyCopy}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <ChartContainer config={config} className="aspect-auto h-[260px] w-full">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 36, left: 8, bottom: 0 }}>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            tickLine={false}
            axisLine={false}
            width={92}
            tick={{ fontSize: 11 }}
          />
          <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={22}>
            {rows.map((row, index) => (
              <Cell key={row.name} fill={palette[index % palette.length]} />
            ))}
            <LabelList
              dataKey="count"
              position="right"
              className="fill-foreground font-mono text-[11px]"
              formatter={(value) => Number(value).toLocaleString("en-US")}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
      <ul className="flex flex-col gap-2">
        {rows.map((row, index) => (
          <li key={row.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: palette[index % palette.length] }}
              />
              <span className="truncate text-foreground">{row.name}</span>
            </span>
            <span className="font-mono text-muted-foreground tabular-nums">
              {row.count.toLocaleString("en-US")} · {row.value}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
