import { notFound } from "next/navigation"
import { findDuplicates, getApplication } from "@/lib/actions/applications"
import { ApplicationReview } from "./application-review"

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const application = await getApplication(id).catch(() => null)

  if (!application) notFound()

  const duplicates = await findDuplicates({
    phone: application.phone,
    idNumber: application.idNumber,
    tinNumber: application.tinNumber,
    excludeId: application.id,
  }).catch(() => [])

  return <ApplicationReview application={application} duplicates={duplicates} live />
}
