import Link from "next/link"
import { LifeBuoy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageBackLink } from "@/components/page-back-link"

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
    detail: "Uploads run quality and identity heuristics. Reject a file with a reason so the agent gets a clear to-do.",
  },
]

export default function AdminHelpPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 p-4 md:px-8 md:py-8">
      <div>
        <PageBackLink fallback="/admin/dashboard" />
        <h1 className="mt-2 flex items-center gap-3 font-semibold text-4xl tracking-tight text-foreground">
          <span className="h-8 w-1.5 rounded-full bg-accent" aria-hidden />
          Help Center
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Short answers for Kinetic review staff. Float, wallet, and the external registrar stay out of this portal.
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {topics.map((topic) => (
          <li key={topic.title} className="rounded-[1.5rem] bg-card p-5 shadow-sm ring-1 ring-border/60">
            <p className="text-sm font-semibold text-foreground">{topic.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{topic.detail}</p>
          </li>
        ))}
      </ul>

      <div className="rounded-[1.5rem] bg-secondary/70 p-6">
        <p className="font-semibold text-2xl text-foreground">Need a queue?</p>
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
