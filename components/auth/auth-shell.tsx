import type React from "react"
import Image from "next/image"
import { Zap } from "lucide-react"

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 p-3 sm:p-4">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-foreground/5 md:grid-cols-[1fr_1fr]">
        <div className="flex flex-col justify-center px-6 py-7 sm:px-8">
          <div className="mb-5 flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Zap className="size-4" fill="currentColor" />
            </span>
            <span className="font-mono text-base font-semibold tracking-wide text-foreground">KINETIC</span>
            <span className="ml-1 rounded-md bg-accent/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-accent uppercase">
              Agent Portal
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-balance text-foreground">{title}</h1>
          <p className="mt-1.5 text-sm text-pretty text-muted-foreground">{description}</p>

          <div className="mt-5">{children}</div>

          {footer && <div className="mt-4 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>

        <div className="relative hidden md:block">
          <Image
            src="/auth-agent-kiosk.png"
            alt="A registered mobile money agent organizing her kiosk in Dar es Salaam"
            fill
            sizes="(min-width: 768px) 50vw, 0px"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-sidebar/85 via-sidebar/20 to-transparent" />
          <div className="absolute bottom-5 left-5 right-5">
            <p className="text-sm font-medium text-sidebar-foreground">Dar es Salaam — Tanzania Hub</p>
            <p className="mt-1 text-xs text-sidebar-foreground/70 text-pretty">
              Where thousands of agents run, grow, and verify their agencies every day.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
