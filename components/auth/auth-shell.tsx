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
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 p-4 sm:p-6 md:p-10">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-foreground/5 md:min-h-[680px] md:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col justify-center px-6 py-10 sm:px-10 md:py-14">
          <div className="mb-8 flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Zap className="size-4" fill="currentColor" />
            </span>
            <span className="font-mono text-base font-semibold tracking-wide text-foreground">KINETIC</span>
            <span className="ml-1 rounded-md bg-accent/15 px-2 py-0.5 text-xs font-semibold tracking-wide text-accent uppercase">
              Agent Portal
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-balance text-foreground md:text-3xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-pretty text-muted-foreground">{description}</p>

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
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
          <div className="absolute inset-0 bg-gradient-to-t from-sidebar/80 via-sidebar/10 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <p className="text-sm font-medium text-sidebar-foreground">Tanzania Hub — Dar es Salaam</p>
            <p className="mt-1 text-xs text-sidebar-foreground/70">
              Manage your agency, track your application, and stay verified — all in one place.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
