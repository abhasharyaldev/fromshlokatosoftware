import { requireSession } from "@/lib/session"
import { SettingsView } from "./SettingsView"

export default async function SettingsPage() {
  const session = await requireSession()

  return (
    <SettingsView
      username={session.username}
      email={session.email}
    />
  )
}
