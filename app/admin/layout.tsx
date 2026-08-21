import type React from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import { AuthGuard } from "@/components/auth/auth-guard"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard role="admin">
      <AdminShell>{children}</AdminShell>
    </AuthGuard>
  )
}
