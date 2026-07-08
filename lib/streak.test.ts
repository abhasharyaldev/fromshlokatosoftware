// Pure-function tests for computeStreak.
// Run with: npx tsx lib/streak.test.ts
// (No test runner needed — assertions throw on failure.)

import { computeStreak } from "./streak"
import assert from "node:assert/strict"

// Fixed reference date: 2026-07-07T14:30:00Z (mid-day UTC)
const NOW = new Date("2026-07-07T14:30:00Z")

function daysAgo(d: Date, n: number): Date {
  const copy = new Date(d)
  copy.setUTCDate(copy.getUTCDate() - n)
  return copy
}

// ── First activity ever ───────────────────────────────────────────────────────
{
  const r = computeStreak(0, null, NOW)
  assert.equal(r.streakDays, 1, "first activity → streakDays = 1")
  assert.equal(r.lastActiveAt.getTime(), NOW.getTime(), "lastActiveAt = now")
  console.log("✓ first activity ever → streak = 1")
}

// ── Same UTC day → no change ──────────────────────────────────────────────────
{
  const earlierToday = new Date("2026-07-07T02:00:00Z")
  const r = computeStreak(5, earlierToday, NOW)
  assert.equal(r.streakDays, 5, "same day → streakDays unchanged")
  assert.equal(r.lastActiveAt.getTime(), NOW.getTime(), "lastActiveAt bumped to now")
  console.log("✓ same UTC day → streak unchanged (still 5)")
}

// ── Same day, minutes apart ───────────────────────────────────────────────────
{
  const minutesAgo = new Date(NOW.getTime() - 5 * 60 * 1000)
  const r = computeStreak(3, minutesAgo, NOW)
  assert.equal(r.streakDays, 3, "minutes ago → same day, no change")
  console.log("✓ same day, minutes apart → streak unchanged (still 3)")
}

// ── Yesterday → increment ─────────────────────────────────────────────────────
{
  const yesterday = daysAgo(NOW, 1)
  const r = computeStreak(7, yesterday, NOW)
  assert.equal(r.streakDays, 8, "yesterday → increment")
  console.log("✓ yesterday → streak incremented (7 → 8)")
}

// ── Yesterday at 23:59 UTC → still counts as yesterday ────────────────────────
{
  const yesterdayLate = new Date("2026-07-06T23:59:00Z")
  const r = computeStreak(10, yesterdayLate, NOW)
  assert.equal(r.streakDays, 11, "late yesterday → increment")
  console.log("✓ late yesterday (23:59 UTC) → streak incremented (10 → 11)")
}

// ── Today at 00:00 UTC → still today, no change ───────────────────────────────
{
  const todayStart = new Date("2026-07-07T00:00:00Z")
  const r = computeStreak(4, todayStart, NOW)
  assert.equal(r.streakDays, 4, "same day (00:00 UTC) → no change")
  console.log("✓ today 00:00 UTC → streak unchanged (still 4)")
}

// ── 2 days ago → reset to 1 ───────────────────────────────────────────────────
{
  const twoDaysAgo = daysAgo(NOW, 2)
  const r = computeStreak(15, twoDaysAgo, NOW)
  assert.equal(r.streakDays, 1, "2+ days ago → reset")
  console.log("✓ 2 days ago → streak reset to 1 (was 15)")
}

// ── 30 days ago → reset to 1 ──────────────────────────────────────────────────
{
  const monthAgo = daysAgo(NOW, 30)
  const r = computeStreak(42, monthAgo, NOW)
  assert.equal(r.streakDays, 1, "month ago → reset")
  console.log("✓ 30 days ago → streak reset to 1 (was 42)")
}

// ── UTC boundary edge case: 23:59 vs 00:01 of next day ────────────────────────
{
  // lastActiveAt was 2026-07-06T23:59:59Z (yesterday UTC)
  // now is 2026-07-07T00:00:01Z (today UTC, but only 2 seconds later)
  const late = new Date("2026-07-06T23:59:59Z")
  const early = new Date("2026-07-07T00:00:01Z")
  const r = computeStreak(1, late, early)
  assert.equal(r.streakDays, 2, "cross-midnight UTC → increment")
  console.log("✓ cross-midnight UTC (2s apart) → streak incremented (1 → 2)")
}

// ── First activity with existing streakDays > 0 (defensive) ───────────────────
// Even if a user somehow has streakDays but no lastActiveAt, first-activity
// rule wins and resets to 1.
{
  const r = computeStreak(99, null, NOW)
  assert.equal(r.streakDays, 1, "null lastActiveAt overrides streakDays")
  console.log("✓ null lastActiveAt with dangling streak → reset to 1")
}

console.log("\n✅ All streak tests passed.")
