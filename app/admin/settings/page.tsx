import { SettingsWorkspace } from "@/components/settings-workspace"
import { SetupBanner } from "@/components/setup-banner"
import { getSession } from "@/lib/actions/auth"
import { isPrismaConfigured, isSupabaseConfigured } from "@/lib/backend/env"

export default async function AdminSettingsPage() {
  const live = isSupabaseConfigured() && isPrismaConfigured()
  const session = live ? await getSession() : null

  return (
    <div className="portal-page">
      <SetupBanner mode={live ? "live" : "setup"} />
      <SettingsWorkspace
        portal="admin"
        email={session?.email ?? ""}
        name={session?.name ?? "Admin"}
        live={live}
        role={session?.title ?? "Administrator"}
      />
    </div>
  )
}
