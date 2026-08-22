"use client"

import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { VolumePoint } from "./types"

const config = {
  submitted: { label: "Submitted", color: "var(--chart-4)" },
  approved: { label: "Verified", color: "var(--chart-3)" },
  rejected: { label: "Rejected", color: "var(--chart-5)" },
  approvalRate: { label: "Approval rate", color: "var(--chart-1)" },
}

export function VolumeChart({ data }: { data: VolumePoint[] }) {
  const rows = data.map((row) => {
    const decided = row.approved + row.rejected
    return {
      ...row,
      approvalRate: row.approvalRate ?? (decided === 0 ? 0 : Math.round((row.approved / decided) * 100)),
    }
  })

  if (!rows.length) {
    return (
      <div className="portal-empty">
        <p className="portal-empty-title">No monthly volume yet</p>
        <p className="portal-empty-copy">Submitted applications will appear here by month.</p>
      </div>
    )
  }

  return (
    <ChartContainer config={config} className="aspect-auto h-[320px] w-full">
      <ComposedChart data={rows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="submittedFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-submitted)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--color-submitted)" stopOpacity={0.04} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <YAxis yAxisId="count" tickLine={false} axisLine={false} width={36} allowDecimals={false} />
        <YAxis
          yAxisId="rate"
          orientation="right"
          tickLine={false}
          axisLine={false}
          width={40}
          domain={[0, 100]}
          tickFormatter={(value) => `${value}%`}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Area
          yAxisId="count"
          type="monotone"
          dataKey="submitted"
          stroke="var(--color-submitted)"
          strokeWidth={2}
          fill="url(#submittedFill)"
        />
        <Line
          yAxisId="count"
          type="monotone"
          dataKey="approved"
          stroke="var(--color-approved)"
          strokeWidth={2}
          dot={{ r: 3, strokeWidth: 0 }}
          activeDot={{ r: 4 }}
        />
        <Line
          yAxisId="count"
          type="monotone"
          dataKey="rejected"
          stroke="var(--color-rejected)"
          strokeWidth={2}
          strokeDasharray="5 4"
          dot={{ r: 3, strokeWidth: 0 }}
        />
        <Line
          yAxisId="rate"
          type="monotone"
          dataKey="approvalRate"
          stroke="var(--color-approvalRate)"
          strokeWidth={2}
          strokeDasharray="2 3"
          dot={false}
        />
      </ComposedChart>
    </ChartContainer>
  )
}
