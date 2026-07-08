import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

const CATEGORY_LABELS: Record<string, string> = {
  alphabet:        "Script",
  transliteration: "IAST",
  vocabulary:      "Vocabulary",
  grammar:         "Grammar",
  shlokas:         "Shlokas",
}

const CATEGORY_DESC: Record<string, string> = {
  alphabet:        "Master the Devanāgarī script",
  transliteration: "Read and write IAST notation",
  vocabulary:      "Core words and their meaning",
  grammar:         "Declensions, cases, and syntax",
  shlokas:         "Sacred verses word by word",
}

const DIFFICULTY_RANK: Record<string, number> = {
  beginner: 1, intermediate: 2, advanced: 3,
}

export default async function LearnPage() {
  const [lessons, session] = await Promise.all([
    prisma.lesson.findMany({
      orderBy: [{ category: "asc" }, { order: "asc" }],
      select: {
        id: true, slug: true, title: true,
        category: true, difficulty: true, xpReward: true,
        _count: { select: { questions: true } },
      },
    }),
    getSession(),
  ])

  // Group by category preserving sort order
  const grouped = lessons.reduce<Record<string, typeof lessons>>((acc, l) => {
    if (!acc[l.category]) acc[l.category] = []
    acc[l.category].push(l)
    return acc
  }, {})

  return (
    <div style={{ minHeight: "100dvh", background: "var(--cream)" }}>
      {/* ── Top bar ── */}
      <div
        style={{
          position: "sticky", top: 0, zIndex: 40,
          background: "var(--cream)", borderBottom: "1px solid var(--gold-line)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 clamp(20px, 5vw, 64px)", height: 64,
        }}
      >
        <Link
          href={session ? "/dashboard" : "/"}
          className="font-cinzel"
          style={{ fontSize: 14, fontWeight: 700, color: "var(--gold)", textDecoration: "none", letterSpacing: "0.04em" }}
        >
          ॐ FSTS
        </Link>
        <div style={{ display: "flex", gap: 12 }}>
          {session ? (
            <Link href="/dashboard" className="btn-ghost" style={{ fontSize: 11, padding: "9px 20px" }}>
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login"  className="btn-ghost" style={{ fontSize: 11, padding: "9px 20px" }}>Sign in</Link>
              <Link href="/signup" className="btn-gold"  style={{ fontSize: 11, padding: "9px 20px" }}>Begin free</Link>
            </>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(40px, 6vw, 80px) clamp(20px, 5vw, 48px)" }}>

        {/* ── Hero ── */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>The Curriculum</div>
          <h1
            className="font-cinzel"
            style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 700, color: "var(--brown)", lineHeight: 1.15, marginBottom: 20 }}
          >
            {lessons.length} Lessons.<br />
            <span style={{ color: "var(--gold)" }}>All of them free.</span>
          </h1>
          <p className="font-manrope" style={{ fontSize: 16, color: "var(--brown-soft)", maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
            From the first letter of Devanāgarī to the opening verse of the Ṛgveda — at your own pace, at no cost.
          </p>

          {!session && (
            <div style={{ marginTop: 28, display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/signup" className="btn-gold"  style={{ fontSize: 12, padding: "15px 40px" }}>Create free account</Link>
              <Link href="/login"  className="btn-ghost" style={{ fontSize: 12, padding: "15px 40px" }}>Sign in</Link>
            </div>
          )}
        </div>

        {/* ── Lesson groups ── */}
        {Object.entries(grouped).map(([category, categoryLessons]) => (
          <div key={category} style={{ marginBottom: 56 }}>
            {/* Category header */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <div>
                <div className="eyebrow" style={{ fontSize: 10 }}>
                  {CATEGORY_LABELS[category] ?? category}
                </div>
                {CATEGORY_DESC[category] && (
                  <p className="font-manrope" style={{ fontSize: 12, color: "var(--brown-faint)", marginTop: 2 }}>
                    {CATEGORY_DESC[category]}
                  </p>
                )}
              </div>
              <div style={{ flex: 1, height: 1, background: "var(--gold-line)" }} />
              <span className="font-manrope" style={{ fontSize: 12, color: "var(--brown-faint)", flexShrink: 0 }}>
                {categoryLessons.length} {categoryLessons.length === 1 ? "lesson" : "lessons"}
              </span>
            </div>

            {/* Lesson cards — all free, all clickable */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
                gap: 1, background: "var(--gold-line)",
                border: "1px solid var(--gold-line)",
              }}
            >
              {categoryLessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  href={`/learn/${lesson.slug}`}
                  style={{
                    display: "flex", flexDirection: "column", gap: 14,
                    padding: "24px 28px", background: "var(--cream)",
                    textDecoration: "none",
                  }}
                  className="card-lift"
                >
                  {/* Top row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <DiamondRank rank={DIFFICULTY_RANK[lesson.difficulty] ?? 1} />
                    <span className="font-manrope" style={{ fontSize: 11, color: "var(--brown-faint)" }}>
                      {lesson._count.questions}Q
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    className="font-cinzel"
                    style={{ fontSize: 16, fontWeight: 500, color: "var(--brown)", lineHeight: 1.3 }}
                  >
                    {lesson.title}
                  </h3>

                  {/* Footer */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
                    <span
                      style={{
                        fontFamily: "'Manrope', sans-serif", fontSize: 10,
                        fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase",
                        color: "var(--pink)",
                      }}
                    >
                      {lesson.difficulty}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <svg width="8" height="11" viewBox="0 0 8 11" fill="none">
                        <path d="M4 0L7.5 4H5.5V11L0.5 7H2.5V0Z" fill="var(--gold)" />
                      </svg>
                      <span className="font-cinzel" style={{ fontSize: 12, color: "var(--gold)", fontWeight: 500 }}>
                        {lesson.xpReward}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── UI helpers ────────────────────────────────────────────────────────────────

function DiamondRank({ rank }: { rank: number }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            width: 6, height: 6, transform: "rotate(45deg)",
            background: i <= rank ? "var(--gold)" : "rgba(42,24,16,0.12)",
          }}
        />
      ))}
    </div>
  )
}
