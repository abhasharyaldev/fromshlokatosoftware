import { requireSession } from "@/lib/session"
import { AppNav } from "@/components/nav/AppNav"
import type { ReactNode } from "react"

// Server Component — reads session from DB on every request.
// requireSession() redirects to /login if cookie is missing or user not found.
// The middleware does a fast cookie-only check at the edge; this does the real
// DB validation so stale/deleted sessions are caught immediately.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireSession()
  return <AppNav user={user}>{children}</AppNav>
}
