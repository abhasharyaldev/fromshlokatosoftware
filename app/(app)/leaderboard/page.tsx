import { requireSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { LeaderboardView, type LeaderRow } from "./LeaderboardView"

const LIMIT = 50

export default async function LeaderboardPage() {
  const session = await requireSession()

  // Fetch both leaderboards in parallel.
  // ONLY the four public fields are selected — no email, no ids, no password data.
  const [xpUsers, eloUsers] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ xp: "desc" }, { createdAt: "asc" }],
      take: LIMIT,
      select: { username: true, level: true, xp: true, eloRating: true },
    }),
    prisma.user.findMany({
      orderBy: [{ eloRating: "desc" }, { createdAt: "asc" }],
      take: LIMIT,
      select: { username: true, level: true, xp: true, eloRating: true },
    }),
  ])

  const xpRows: LeaderRow[]  = xpUsers.map((u, i)  => ({ rank: i + 1, ...u }))
  const eloRows: LeaderRow[] = eloUsers.map((u, i) => ({ rank: i + 1, ...u }))

  return (
    <LeaderboardView
      xpRows={xpRows}
      eloRows={eloRows}
      currentUsername={session.username}
    />
  )
}
