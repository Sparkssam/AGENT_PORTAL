import Link from "next/link"
import { LifeBuoy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageBackLink } from "@/components/page-back-link"

const topics = [
  {
    title: "Finish your application",
    detail: "Complete identity, location, documents, and the TZS 100,000 deposit before you submit.",
  },
  {
    title: "Upload clearer files",
    detail: "Use a well-lit photo or PDF. Blurry ID pages and cropped shop images are sent back for correction.",
  },
  {
    title: "Correction requests",
    detail: "If review asks for a change, open the checklist on your application and resubmit when every item is done.",
  },
  {
    title: "Deposit proof",
    detail: "Enter the mobile-money reference and attach the receipt. Review cannot complete a case without it.",
  },
]

export default function HelpCenterPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 p-4 md:px-8 md:py-8">
      <div>
        <PageBackLink fallback="/agent/dashboard" />
        <h1 className="mt-2 flex items-center gap-3 font-semibold text-4xl tracking-tight text-foreground">
          <span className="h-8 w-1.5 rounded-full bg-accent" aria-hidden />
          Help Center
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Short answers for the Kinetic agent portal. This is the collection-and-review workspace, not the float or
          wallet product.
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
        <p className="font-semibold text-2xl text-foreground">Still stuck?</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Open your application and check the correction list first. If a document will not upload, try a smaller JPG or
          PDF under 10MB.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button nativeButton={false} render={<Link href="/agent/applications" />}>
            <LifeBuoy data-icon="inline-start" />
            My applications
          </Button>
          <Button variant="outline" nativeButton={false} render={<Link href="/agent/settings" />}>
            Account settings
          </Button>
        </div>
      </div>
    </div>
  )
}
