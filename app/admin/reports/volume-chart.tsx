"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { monthlyVolume } from "@/lib/admin-data"

const config = {
  submitted: { label: "Submitted", color: "var(--chart-4)" },
  inReview: { label: "In Review", color: "var(--chart-2)" },
  approved: { label: "Approved", color: "var(--chart-1)" },
  rejected: { label: "Rejected", color: "var(--chart-5)" },
}

export function VolumeChart() {
  return (
    <ChartContainer config={config} className="h-[280px] w-full">
      <BarChart data={monthlyVolume} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} width={40} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="submitted" fill="var(--color-submitted)" radius={[3, 3, 0, 0]} />
        <Bar dataKey="inReview" fill="var(--color-inReview)" radius={[3, 3, 0, 0]} />
        <Bar dataKey="approved" fill="var(--color-approved)" radius={[3, 3, 0, 0]} />
        <Bar dataKey="rejected" fill="var(--color-rejected)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
