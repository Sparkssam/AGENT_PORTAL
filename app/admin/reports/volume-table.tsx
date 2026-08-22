import type { VolumePoint } from "./types"

export type { VolumePoint }

export function VolumeTable({ data }: { data: VolumePoint[] }) {
  if (!data.length) return null
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">Monthly application volume, outcomes, and approval rate</caption>
        <thead>
          <tr className="portal-table-head">
            <th className="px-3 py-2 text-left">Month</th>
            <th className="px-3 py-2 text-right">Submitted</th>
            <th className="px-3 py-2 text-right">In review</th>
            <th className="px-3 py-2 text-right">Verified</th>
            <th className="px-3 py-2 text-right">Rejected</th>
            <th className="px-3 py-2 text-right">Approval</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const decided = row.approved + row.rejected
            const rate = row.approvalRate ?? (decided === 0 ? 0 : Math.round((row.approved / decided) * 100))
            return (
              <tr key={row.month} className="portal-table-row">
                <td className="px-3 py-2 font-medium text-foreground">{row.month}</td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">{row.submitted.toLocaleString("en-US")}</td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">{row.inReview.toLocaleString("en-US")}</td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">{row.approved.toLocaleString("en-US")}</td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">{row.rejected.toLocaleString("en-US")}</td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">{rate}%</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
