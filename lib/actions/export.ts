"use server"

import { getApplication, listApplications } from "@/lib/actions/applications"
import { requireAdmin } from "@/lib/backend/session"
import { filterApplications, type ApplicationListFilters } from "@/lib/applications/filters"

export async function copyAllPayload(applicationId: string) {
  await requireAdmin()
  const app = await getApplication(applicationId)
  return [
    `Agent Name: ${app.agentName}`,
    `Registered Phone: ${app.phone}`,
    `Email: ${app.email}`,
    `Business Name: ${app.businessName ?? ""}`,
    `Business Sector: ${app.sector}`,
    `Channel: ${app.channel}`,
    `ID Type: ${app.idType}`,
    `ID Number: ${app.idNumber}`,
    `TIN: ${app.tinNumber ?? ""}`,
    `Issued Place: ${app.issuedPlace}`,
    `Gender: ${app.gender}`,
    `Country: ${app.country}`,
    `Region: ${app.province}`,
    `District: ${app.district}`,
    `Ward: ${app.ward}`,
    `Location: ${[app.street, app.houseNumber].filter(Boolean).join(", ")}`,
    `Latitude: ${app.lat}`,
    `Longitude: ${app.lng}`,
    `Application Number: ${app.appNumber}`,
    `Application Status: ${app.status}`,
    `Deposit Status: ${app.depositStatus}`,
    `Deposit Amount: ${app.depositAmount}`,
    `Deposit Reference: ${app.depositReference ?? ""}`,
  ].join("\n")
}

export async function applicationsCsv(filters?: ApplicationListFilters & { ids?: string[] }) {
  await requireAdmin()
  let apps = await listApplications()
  if (filters?.ids?.length) {
    const allowed = new Set(filters.ids)
    apps = apps.filter((app) => allowed.has(app.id))
  } else if (filters) {
    apps = filterApplications(apps, filters)
  }
  const header = [
    "application_number",
    "agent_name",
    "phone",
    "email",
    "channel",
    "sector",
    "region",
    "status",
    "deposit_status",
    "submitted_at",
  ]
  const lines = apps.map((app) =>
    [
      app.appNumber,
      app.agentName,
      app.phone,
      app.email,
      app.channel,
      app.sector,
      app.province,
      app.status,
      app.depositStatus,
      app.submittedAt,
    ]
      .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
      .join(","),
  )
  return `\uFEFF${[header.join(","), ...lines].join("\n")}`
}
