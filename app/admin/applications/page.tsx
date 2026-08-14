import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ApplicationsTable } from "./applications-table"

export default function ApplicationsPage() {
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Applications</h1>
          <p className="mt-1 text-sm text-muted-foreground">Search, filter, and review agent applications.</p>
        </div>
        <Button variant="outline">
          <Download data-icon="inline-start" />
          Export
        </Button>
      </div>

      <ApplicationsTable />
    </div>
  )
}
