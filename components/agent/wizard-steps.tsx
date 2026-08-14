import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface WizardStep {
  label: string
}

export function WizardSteps({ steps, current }: { steps: WizardStep[]; current: number }) {
  return (
    <ol className="flex items-center gap-2 overflow-x-auto">
      {steps.map((step, index) => {
        const stepNumber = index + 1
        const state = stepNumber < current ? "done" : stepNumber === current ? "active" : "upcoming"
        return (
          <li key={step.label} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  state === "done" && "bg-primary text-primary-foreground",
                  state === "active" && "bg-accent text-accent-foreground",
                  state === "upcoming" && "bg-muted text-muted-foreground",
                )}
              >
                {state === "done" ? <Check className="size-3.5" /> : stepNumber}
              </span>
              <span
                className={cn(
                  "hidden text-sm font-medium whitespace-nowrap sm:inline",
                  state === "upcoming" ? "text-muted-foreground" : "text-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
            {stepNumber < steps.length && (
              <span
                className={cn("h-px w-6 shrink-0 sm:w-10", state === "done" ? "bg-primary" : "bg-border")}
                aria-hidden="true"
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
