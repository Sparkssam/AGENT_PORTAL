import Link from "next/link"
import { LifeBuoy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageBackLink } from "@/components/page-back-link"
import { PageHeader } from "@/components/page-header"

const topics = [
  {
    title: "Review a case",
    detail: "Open Applications, check documents and deposit, then request a correction, reject, or complete.",
  },
  {
    title: "Duplicate warnings",
    detail: "Matching phone, ID, or TIN on another case appears on the review page before you finish onboarding.",
  },
  {
    title: "Copy into the main system",
    detail: "Use Copy All or CSV export. This portal collects and prepares data; it does not replace the registrar.",
  },
  {
    title: "Document checks",
    detail: "Uploads run quality and identity heuristics. Reject a file with a canned reason (blurry, cropped, expired, wrong type) so the agent gets a clear to-do instead of a generic banner.",
  },
]

export default function AdminHelpPage() {
  return (
    <div className="portal-page-narrow">
      <PageHeader
        back={<PageBackLink fallback="/admin/dashboard" />}
        title="Help Center"
        description="Short answers for Kinetic review staff. Float, wallet, and the external registrar stay out of this portal."
      />

      <ul className="flex flex-col gap-3">
        {topics.map((topic) => (
          <li key={topic.title} className="portal-card">
            <p className="text-sm font-semibold text-foreground">{topic.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{topic.detail}</p>
          </li>
        ))}
      </ul>

      <div className="portal-card-muted">
        <p className="portal-card-title">Need a queue?</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Start from Overview or Applications. Search by application number, agent name, phone, or ID.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button nativeButton={false} render={<Link href="/admin/applications" />}>
            <LifeBuoy data-icon="inline-start" />
            Applications
          </Button>
          <Button variant="outline" nativeButton={false} render={<Link href="/admin/settings" />}>
            Settings
          </Button>
        </div>
      </div>
    </div>
  )
}
