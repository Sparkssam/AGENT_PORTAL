"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PageBackLink({
  fallback,
  label = "Back",
}: {
  fallback: string
  label?: string
}) {
  const router = useRouter()

  function handleBack() {
    if (typeof document !== "undefined" && document.referrer.startsWith(window.location.origin)) {
      router.back()
      return
    }
    router.push(fallback)
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-2 w-fit text-muted-foreground hover:text-foreground"
      onClick={handleBack}
    >
      <ArrowLeft data-icon="inline-start" />
      {label}
    </Button>
  )
}
