import Link from "next/link"
import { requireSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { buildAchievementDisplay } from "@/lib/achievements"

// XP required to reach level (n+1) — inverse of level = floor(sqrt(xp/100))
function xpForLevel(level: number): number {
  return Math.pow(level, 2) * 100
}

const DIFFICULTY_RANK: Record<string, number> = {
  beginner: 1, intermediate: 2, advanced: 3,
}

export default async function Dashboard() {
  const user = await requireSession()

  const [lessons, progress, earnedRaw] = await Promise.all([
    prisma.lesson.findMany({
      orderBy: [{ category: "asc" }, { order: "asc" }],
      select: {
        id: true, slug: true, title: true,
        category: true, difficulty: true, xpReward: true,
      },
    }),
    prisma.userProgress.findMany({
      where: { userId: user.id },
      select: { lessonId: true, score: true },
    }),
    prisma.achievement.findMany({
      where:   { userId: user.id },
      select:  { achievementKey: true, earnedAt: true },
      orderBy: { earnedAt: "desc" },
    }),
  ])

  const achievements = buildAchievementDisplay(
    earnedRaw.map((a) => ({ achievementKey: a.achievementKey, earnedAt: a.earnedAt })),
  )

  const progressMap  = new Map(progress.map((p) => [p.lessonId, p.score]))
  const completedCount = progress.length

  // Recommend the first uncompleted lesson (or fall back to the first lesson)
  const nextLesson = lessons.find((l) => !progressMap.has(l.id)) ?? lessons[0]

  // Progress bar to next level
  const currentLevelXp  = xpForLevel(user.level)
  const nextLevelXp     = xpForLevel(user.level + 1)
  const xpIntoLevel     = Math.max(0, user.xp - currentLevelXp)
  const xpNeededForNext = nextLevelXp - currentLevelXp
  const xpPercent       = xpNeededForNext > 0
    ? Math.min(100, Math.round((xpIntoLevel / xpNeededForNext) * 100))
    : 100

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(24px,4vw,56px) clamp(16px,4vw,48px)" }}>

      {/* ── Greeting ── */}
      <div style={{ marginBottom: 40 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Namaste</div>
        <h1
          className="font-cinzel"
          style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 700, color: "var(--brown)", letterSpacing: "-0.01em", lineHeight: 1.15 }}
        >
          Welcome back, <span style={{ color: "var(--gold)" }}>{user.username}</span>.
        </h1>
      </div>

      {/* ── Level + XP progress ── */}
      <div style={{ border: "1px solid var(--gold-line)", padding: "28px 32px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Level</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span className="font-cinzel" style={{ fontSize: "clamp(48px, 8vw, 72px)", fontWeight: 700, color: "var(--brown)", lineHeight: 1 }}>
                {user.level}
              </span>
              <span className="font-manrope" style={{ fontSize: 14, color: "var(--brown-soft)" }}>
                {xpIntoLevel} / {xpNeededForNext} to Level {user.level + 1}
              </span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Total Shakti</div>
            <div className="font-cinzel" style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, color: "var(--gold)" }}>
              {user.xp.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 8, background: "rgba(42,24,16,0.10)", borderRadius: 4, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${xpPercent}%`,
              background: "linear-gradient(90deg, var(--gold) 0%, var(--pink) 100%)",
              transition: "width 600ms ease-out",
            }}
          />
        </div>
      </div>

      {/* ── Stats row: Streak, ELO, Lessons ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 1, background: "var(--gold-line)", border: "1px solid var(--gold-line)", marginBottom: 40 }}>
        <StatCell label="Day Streak"       value={`${user.streakDays}d`}  accent="var(--pink)" />
        <StatCell label="Battle Rating"    value={user.eloRating.toString()} accent="var(--burgundy)" />
        <StatCell label="Lessons Complete" value={`${completedCount}/${lessons.length}`} accent="var(--gold)" />
      </div>

      {/* ── Continue Learning ── */}
      {nextLesson && (
        <div
          style={{
            border: "1px solid var(--gold-line)",
            padding: "32px",
            marginBottom: 40,
            background: "linear-gradient(135deg, rgba(214,168,79,0.06) 0%, transparent 60%)",
          }}
        >
          <div className="eyebrow" style={{ marginBottom: 16 }}>Recommended Next</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>
            <div style={{ minWidth: 0, flex: "1 1 300px" }}>
              <h3 className="font-cinzel" style={{ fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 500, color: "var(--brown)", marginBottom: 8, lineHeight: 1.3 }}>
                {nextLesson.title}
              </h3>
              <p className="font-manrope" style={{ fontSize: 13, color: "var(--brown-soft)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {nextLesson.category} · {nextLesson.difficulty} · +{nextLesson.xpReward} Shakti
              </p>
            </div>
            <Link href={`/learn/${nextLesson.slug}`} className="btn-gold" style={{ fontSize: 12, padding: "14px 36px" }}>
              Begin Lesson
            </Link>
          </div>
        </div>
      )}

      {/* ── Quick actions ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 40 }}>
        <QuickAction href="/battle"      title="Enter Battle" desc="Test your Sanskrit in real-time PvP" />
        <QuickAction href="/leaderboard" title="Leaderboard"  desc="See how you compare across the world" />
        <QuickAction href="/learn"       title="All Lessons"  desc={`Browse the full library of ${lessons.length}`} />
      </div>

      {/* ── Achievements ── */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
          <div className="eyebrow" style={{ fontSize: 10 }}>Achievements</div>
          <span className="font-manrope" style={{ fontSize: 12, color: "var(--brown-faint)" }}>
            {achievements.filter((a) => a.earned).length} / {achievements.length}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))", gap: 1, background: "var(--gold-line)", border: "1px solid var(--gold-line)" }}>
          {achievements.map((a) => (
            <div
              key={a.key}
              style={{
                display: "flex", alignItems: "flex-start", gap: 14,
                padding: "16px 20px",
                background: a.earned ? "var(--cream)" : "rgba(42,24,16,0.02)",
                opacity: a.earned ? 1 : 0.45,
              }}
            >
              <div
                style={{
                  width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                  background: a.earned ? "var(--gold)" : "var(--gold-line)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <AchievementIcon category={a.category} earned={a.earned} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="font-cinzel" style={{ fontSize: 12, fontWeight: 600, color: "var(--brown)", marginBottom: 3 }}>
                  {a.title}
                </div>
                <div className="font-manrope" style={{ fontSize: 11, color: "var(--brown-soft)", lineHeight: 1.4 }}>
                  {a.description}
                </div>
                {a.earnedAt && (
                  <div className="font-manrope" style={{ fontSize: 10, color: "var(--gold)", marginTop: 4 }}>
                    {new Date(a.earnedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent progress (last 4 completed) ── */}
      {progress.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>Your Progress</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 220px), 1fr))", gap: 1, background: "var(--gold-line)", border: "1px solid var(--gold-line)" }}>
            {lessons
              .filter((l) => progressMap.has(l.id))
              .slice(0, 8)
              .map((lesson) => {
                const score = progressMap.get(lesson.id)!
                return (
                  <Link
                    key={lesson.id}
                    href={`/learn/${lesson.slug}`}
                    style={{ display: "flex", flexDirection: "column", gap: 8, padding: "18px 20px", background: "var(--cream)", textDecoration: "none" }}
                    className="card-lift"
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--pink)", fontFamily: "'Manrope', sans-serif" }}>
                        {lesson.category}
                      </span>
                      <DifficultyDiamonds level={DIFFICULTY_RANK[lesson.difficulty] ?? 1} />
                    </div>
                    <h4 className="font-cinzel" style={{ fontSize: 14, fontWeight: 500, color: "var(--brown)", lineHeight: 1.3 }}>
                      {lesson.title}
                    </h4>
                    <div style={{ height: 2, background: "rgba(42,24,16,0.08)" }}>
                      <div style={{ height: "100%", width: `${score}%`, background: score === 100 ? "var(--gold)" : "var(--pink)" }} />
                    </div>
                    <span className="font-manrope" style={{ fontSize: 11, color: "var(--brown-faint)" }}>
                      {score === 100 ? "Complete" : `${score}%`}
                    </span>
                  </Link>
                )
              })}
          </div>
        </div>
      )}

    </div>
  )
}

// ── UI helpers ────────────────────────────────────────────────────────────────

function StatCell({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{ background: "var(--cream)", padding: "22px 26px" }}>
      <div className="eyebrow" style={{ marginBottom: 10, fontSize: 10 }}>{label}</div>
      <div className="font-cinzel" style={{ fontSize: "clamp(24px, 4vw, 34px)", fontWeight: 700, color: accent, lineHeight: 1 }}>
        {value}
      </div>
    </div>
  )
}

function QuickAction({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      style={{
        display: "flex", flexDirection: "column", gap: 6,
        padding: "22px 24px",
        border: "1px solid var(--gold-line)", background: "var(--cream)",
        textDecoration: "none", transition: "border-color 150ms",
      }}
      className="card-lift"
    >
      <h4 className="font-cinzel" style={{ fontSize: 15, fontWeight: 500, color: "var(--brown)" }}>
        {title} <span style={{ color: "var(--gold)" }}>→</span>
      </h4>
      <p className="font-manrope" style={{ fontSize: 13, color: "var(--brown-soft)" }}>
        {desc}
      </p>
    </Link>
  )
}

function AchievementIcon({ category, earned }: { category: string; earned: boolean }) {
  const color = earned ? "var(--cream)" : "var(--brown-faint)"
  const size  = 16
  // Simple geometric SVG marks — no emoji, no external assets
  if (category === "battle") {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <polygon points="8,1 15,15 1,15" stroke={color} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      </svg>
    )
  }
  if (category === "dedication") {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <path d="M8 2 L9.8 6.5 L14.5 6.5 L10.8 9.5 L12.2 14 L8 11 L3.8 14 L5.2 9.5 L1.5 6.5 L6.2 6.5 Z" stroke={color} strokeWidth="1.2" fill="none" strokeLinejoin="round" />
      </svg>
    )
  }
  if (category === "progression") {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <path d="M2 13 L6 8 L10 10 L14 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  // learning / default
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="12" height="12" rx="1" stroke={color} strokeWidth="1.5" />
      <path d="M5 8 L7 10 L11 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DifficultyDiamonds({ level, max = 3 }: { level: number; max?: number }) {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      {Array.from({ length: max }).map((_, i) => (
        <div key={i} style={{ width: 5, height: 5, background: i < level ? "var(--gold)" : "rgba(42,24,16,0.15)", transform: "rotate(45deg)", flexShrink: 0 }} />
      ))}
    </div>
  )
}
