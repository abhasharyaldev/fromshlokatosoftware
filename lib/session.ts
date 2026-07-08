import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export interface SessionUser {
  id: string
  username: string
  email: string
  xp: number
  level: number
  streakDays: number
  eloRating: number
  role: string // "USER" | "ADMIN"
}

// Reads session cookie and returns the user from DB, or null.
// Never throws — safe to call in any Server Component or Server Action.
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies()
  const userId = store.get("session_user_id")?.value
  if (!userId) return null

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      xp: true,
      level: true,
      streakDays: true,
      eloRating: true,
      role: true,
    },
  })

  return user ?? null
}

// Like getSession but redirects to /login if no session.
// Use this in protected Server Components and Server Actions.
export async function requireSession(): Promise<SessionUser> {
  const session = await getSession()
  if (!session) redirect("/login")
  return session
}

// Shared cookie config — single source of truth for both actions and API routes.
export const SESSION_COOKIE = {
  name: "session_user_id",
  options: {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
}
