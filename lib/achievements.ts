import { prisma } from "./prisma"

// ── Definitions ───────────────────────────────────────────────────────────────
// Single source of truth for every achievement the system knows about.
// Keys match the achievementKey column in the Achievement table.

export const ACHIEVEMENT_DEFS = {
  first_lesson_completed: {
    title:       "First Steps",
    description: "Complete your first lesson",
    category:    "learning",
  },
  five_lessons_completed: {
    title:       "Devoted Learner",
    description: "Complete five lessons",
    category:    "learning",
  },
  first_battle_played: {
    title:       "Warrior Enters",
    description: "Play your first battle",
    category:    "battle",
  },
  first_battle_win: {
    title:       "First Victory",
    description: "Win your first battle",
    category:    "battle",
  },
  seven_day_streak: {
    title:       "Seven Sacred Days",
    description: "Maintain a 7-day learning streak",
    category:    "dedication",
  },
  level_5_reached: {
    title:       "Ascending",
    description: "Reach level 5",
    category:    "progression",
  },
} as const satisfies Record<string, { title: string; description: string; category: string }>

export type AchievementKey = keyof typeof ACHIEVEMENT_DEFS

export interface DisplayAchievement {
  key:         AchievementKey
  title:       string
  description: string
  category:    string
  earned:      boolean
  earnedAt:    string | null   // ISO string
}

// ── Display helper ────────────────────────────────────────────────────────────

// Merges earned DB rows with the full definition list.
// Returns all achievements in definition order, earned or not.
export function buildAchievementDisplay(
  earned: { achievementKey: string; earnedAt: Date }[],
): DisplayAchievement[] {
  const earnedMap = new Map(earned.map((a) => [a.achievementKey, a.earnedAt]))

  return (Object.entries(ACHIEVEMENT_DEFS) as [AchievementKey, typeof ACHIEVEMENT_DEFS[AchievementKey]][]).map(
    ([key, def]) => ({
      key,
      title:       def.title,
      description: def.description,
      category:    def.category,
      earned:      earnedMap.has(key),
      earnedAt:    earnedMap.get(key)?.toISOString() ?? null,
    }),
  )
}

// ── Checker ───────────────────────────────────────────────────────────────────
// Called server-side only — never from any client code.
// Returns the keys of achievements newly granted in this call.

type LessonContext = {
  trigger: "lesson_completed"
}

type BattleContext = {
  trigger: "battle_finished"
  winnerId: string | null
}

export async function checkAndGrantAchievements(
  userId: string,
  context: LessonContext | BattleContext,
): Promise<AchievementKey[]> {
  // Fetch what this user already has — used to skip re-granting
  const existing = await prisma.achievement.findMany({
    where:  { userId },
    select: { achievementKey: true },
  })
  const alreadyEarned = new Set(existing.map((a) => a.achievementKey))

  const candidates: AchievementKey[] = []

  if (context.trigger === "lesson_completed") {
    // Fetch lesson progress count and fresh user stats in parallel
    const [lessonCount, user] = await Promise.all([
      prisma.userProgress.count({ where: { userId } }),
      prisma.user.findUniqueOrThrow({
        where:  { id: userId },
        select: { streakDays: true, level: true },
      }),
    ])

    if (!alreadyEarned.has("first_lesson_completed") && lessonCount >= 1) {
      candidates.push("first_lesson_completed")
    }
    if (!alreadyEarned.has("five_lessons_completed") && lessonCount >= 5) {
      candidates.push("five_lessons_completed")
    }
    if (!alreadyEarned.has("seven_day_streak") && user.streakDays >= 7) {
      candidates.push("seven_day_streak")
    }
    if (!alreadyEarned.has("level_5_reached") && user.level >= 5) {
      candidates.push("level_5_reached")
    }
  } else {
    // Fetch total finished battles for this user
    const battleCount = await prisma.battle.count({
      where: {
        status: "finished",
        OR: [{ player1Id: userId }, { player2Id: userId }],
      },
    })

    if (!alreadyEarned.has("first_battle_played") && battleCount >= 1) {
      candidates.push("first_battle_played")
    }
    if (!alreadyEarned.has("first_battle_win") && context.winnerId === userId) {
      candidates.push("first_battle_win")
    }
  }

  if (candidates.length === 0) return []

  // createMany + skipDuplicates is idempotent even under concurrent calls
  // because the @@unique([userId, achievementKey]) constraint prevents doubles.
  await prisma.achievement.createMany({
    data:           candidates.map((key) => ({ userId, achievementKey: key })),
    skipDuplicates: true,
  })

  return candidates
}
