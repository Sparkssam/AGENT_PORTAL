import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface WizardStep {
  label: string
}

export function WizardSteps({ steps, current }: { steps: WizardStep[]; current: number }) {
  return (
    <ol className="flex w-full items-center">
      {steps.map((step, index) => {
        const stepNumber = index + 1
        const state = stepNumber < current ? "done" : stepNumber === current ? "active" : "upcoming"
        const connectorFilled = stepNumber < current
        return (
          <li key={`${step.label}-${index}`} className="flex min-w-0 flex-1 items-center last:flex-none">
            <div className="flex shrink-0 flex-col items-center gap-2">
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                  state === "done" && "bg-accent text-accent-foreground",
                  state === "active" && "bg-accent text-accent-foreground",
                  state === "upcoming" && "bg-muted text-muted-foreground",
                )}
              >
                {state === "done" ? <Check className="size-4" /> : stepNumber}
              </span>
              <span
                className={cn(
                  "hidden max-w-24 text-center text-xs font-medium sm:block",
                  state === "upcoming" ? "text-muted-foreground" : "text-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
            {stepNumber < steps.length && (
              <span
                className={cn(
                  "mx-3 mb-6 h-px min-w-4 flex-1 sm:mb-7",
                  connectorFilled || state === "active" ? "bg-accent" : "bg-border",
                )}
                aria-hidden="true"
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
