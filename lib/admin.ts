import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import type { SessionUser } from "@/lib/session"

type AdminGuardOk   = { session: SessionUser; error: null }
type AdminGuardFail = { session: null; error: NextResponse }

/**
 * Call at the top of every admin API route handler.
 * Returns the session when the caller is an ADMIN, or a ready-to-return 403
 * NextResponse when they are not. Role is read fresh from the DB on every
 * request via getSession — it is never trusted from the client.
 *
 * Usage:
 *   const { session, error } = await requireAdmin()
 *   if (error) return error
 */
export async function requireAdmin(): Promise<AdminGuardOk | AdminGuardFail> {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") {
    return {
      session: null,
      error: NextResponse.json({ error: "Forbidden." }, { status: 403 }),
    }
  }
  return { session, error: null }
}

/** Structured admin action log — goes to stdout, picked up by any log aggregator. */
export function adminLog(
  action: string,
  adminId: string,
  detail: Record<string, unknown> = {},
) {
  console.log(
    JSON.stringify({
      level: "INFO",
      source: "admin",
      action,
      adminId,
      ...detail,
      ts: new Date().toISOString(),
    }),
  )
}
