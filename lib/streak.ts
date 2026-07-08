// Pure server-side streak calculation.
// UTC day boundaries — everyone rolls over at 00:00 UTC.
// Never trust client input for streakDays. This function decides everything
// from the DB-authoritative lastActiveAt and current server time.

export interface StreakUpdate {
  streakDays: number
  lastActiveAt: Date
}

/**
 * Compute the next streak state given the user's current record and "now".
 *
 * Rules (MVP):
 *   - No prior activity           → streakDays = 1
 *   - lastActiveAt was TODAY      → unchanged
 *   - lastActiveAt was YESTERDAY  → streakDays + 1
 *   - lastActiveAt older          → streakDays = 1 (reset)
 *
 * @param currentStreak  User's current streakDays from DB
 * @param lastActiveAt   User's current lastActiveAt from DB (null if never)
 * @param now            Server-side clock (accept as arg for testability)
 */
export function computeStreak(
  currentStreak: number,
  lastActiveAt: Date | null,
  now: Date = new Date()
): StreakUpdate {
  const nowUtcDay = utcDayNumber(now)

  if (!lastActiveAt) {
    return { streakDays: 1, lastActiveAt: now }
  }

  const lastUtcDay = utcDayNumber(lastActiveAt)
  const diff = nowUtcDay - lastUtcDay

  if (diff === 0) {
    // Same UTC day — no streak change, but bump lastActiveAt so future writes
    // still see today's activity.
    return { streakDays: currentStreak, lastActiveAt: now }
  }

  if (diff === 1) {
    return { streakDays: currentStreak + 1, lastActiveAt: now }
  }

  // Missed one or more days — reset to 1 (today counts).
  return { streakDays: 1, lastActiveAt: now }
}

/**
 * Convert a Date to an integer "UTC day number" (days since Unix epoch, UTC).
 * Two dates on the same UTC calendar day always share the same number.
 */
function utcDayNumber(d: Date): number {
  return Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 86_400_000)
}
