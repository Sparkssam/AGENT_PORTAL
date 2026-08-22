import type React from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import { AuthGuard } from "@/components/auth/auth-guard"
import { StaffMfaGate } from "@/components/auth/staff-mfa-gate"
import { AdminSessionWatchdog } from "@/components/admin/admin-session-watchdog"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard role="admin">
      <StaffMfaGate>
        <AdminShell>
          <AdminSessionWatchdog />
          {children}
        </AdminShell>
      </StaffMfaGate>
    </AuthGuard>
  )
}
