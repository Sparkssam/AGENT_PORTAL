import { ApplicationWizard } from "@/components/agent/application-wizard"

export default function NewApplicationPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">New Application</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete the steps below to submit your agent application.
        </p>
      </div>
      <ApplicationWizard />
    </div>
  )
}
