import { notifications } from "@/lib/agent-data"
import { NotificationsList } from "./notifications-list"

export default function NotificationsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Updates about your application, documents, and deposit status.
        </p>
      </div>
      <NotificationsList notifications={notifications} />
    </div>
  )
}
