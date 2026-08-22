import { notFound } from "next/navigation"
import { findDuplicates, getApplication } from "@/lib/actions/applications"
import { getSession } from "@/lib/actions/auth"
import { ApplicationReview } from "./application-review"

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const application = await getApplication(id).catch(() => null)

  if (!application) notFound()

  const [duplicates, session] = await Promise.all([
    findDuplicates({
      phone: application.phone,
      idNumber: application.idNumber,
      tinNumber: application.tinNumber,
      excludeId: application.id,
    }).catch(() => []),
    getSession(),
  ])

  return (
    <ApplicationReview
      application={application}
      duplicates={duplicates}
      live
      canFinalize={Boolean(session?.canFinalize)}
    />
  )
}
