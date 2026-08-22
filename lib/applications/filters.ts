import type { Application, AppStatus } from "@/lib/domain"
import { channelMatchesFilter } from "@/lib/lookups/catalog"

export type ApplicationListFilters = {
  query?: string
  status?: string
  channel?: string
  province?: string
  submittedFrom?: string
  submittedTo?: string
}

function inDateRange(iso: string | undefined, from?: string, to?: string) {
  if (!from && !to) return true
  if (!iso) return false
  const stamp = iso.slice(0, 10)
  if (from && stamp < from) return false
  if (to && stamp > to) return false
  return true
}

export function filterApplications(applications: Application[], filters: ApplicationListFilters) {
  const query = filters.query?.trim().toLowerCase() ?? ""
  const status = filters.status && filters.status !== "all" ? filters.status : ""
  const channel = filters.channel && filters.channel !== "all" ? filters.channel : ""
  const province = filters.province?.trim().toLowerCase() ?? ""

  return applications.filter((app) => {
    const matchesQuery =
      query === "" ||
      app.appNumber.toLowerCase().includes(query) ||
      app.agentName.toLowerCase().includes(query) ||
      app.phone.includes(query) ||
      app.idNumber.toLowerCase().includes(query) ||
      (app.tinNumber ?? "").toLowerCase().includes(query)
    const matchesStatus = !status || app.status === (status as AppStatus)
    const matchesChannel = channelMatchesFilter(app.channel, channel || "all")
    const matchesRegion = !province || (app.province ?? "").toLowerCase().includes(province)
    const matchesDate = inDateRange(app.submittedAt, filters.submittedFrom, filters.submittedTo)
    return matchesQuery && matchesStatus && matchesChannel && matchesRegion && matchesDate
  })
}
