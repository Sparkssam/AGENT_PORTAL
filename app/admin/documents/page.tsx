import { DocumentsTable } from "./documents-table"

export const metadata = {
  title: "Documents — Kinetic Admin",
  description: "Browse and verify KYC documents submitted across all applications.",
}

export default function DocumentsPage() {
  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Documents</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every document submitted across applications, in one searchable repository.
        </p>
      </div>
      <DocumentsTable />
    </div>
  )
}
