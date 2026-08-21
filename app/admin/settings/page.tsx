import { SettingsWorkspace } from "@/components/settings-workspace"
import { SetupBanner } from "@/components/setup-banner"
import { getSession } from "@/lib/actions/auth"
import { isPrismaConfigured, isSupabaseConfigured } from "@/lib/backend/env"

export default async function AdminSettingsPage() {
  const live = isSupabaseConfigured() && isPrismaConfigured()
  const session = live ? await getSession() : null

  return (
    <>
      <div className="px-4 pt-4 md:px-8">
        <SetupBanner mode={live ? "live" : "setup"} />
      </div>
      <SettingsWorkspace
        portal="admin"
        email={session?.email ?? ""}
        name={session?.name ?? "Admin"}
        live={live}
        role={session?.title ?? "Administrator"}
      />
    </>
  )
}
