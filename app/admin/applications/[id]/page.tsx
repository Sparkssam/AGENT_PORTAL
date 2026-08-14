import { notFound } from "next/navigation"
import { getApplicationById } from "@/lib/admin-data"
import { ApplicationReview } from "./application-review"

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const application = getApplicationById(id)

  if (!application) notFound()

  return <ApplicationReview application={application} />
}
