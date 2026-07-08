import React from "react"

type SutraStatus = "unlocked" | "locked"

interface Sutra {
  id: string
  name: string
  hint: string
  desc: string
  pattern: string
  status: SutraStatus
  xp: number
  unlockedDate?: string
}

const SUTRAS: Sutra[] = [
  {
    id: "first-breath",
    name: "Prathamākṣara",
    hint: "",
    desc: "You heard the first vowel — अ — the root of all Sanskrit sound.",
    pattern: "A",
    status: "unlocked",
    xp: 50,
    unlockedDate: "May 12, 2026",
  },
  {
    id: "five-vowels",
    name: "Pañcasvara",
    hint: "",
    desc: "You completed the five primordial vowels of the Sanskrit alphabet.",
    pattern: "B",
    status: "unlocked",
    xp: 100,
    unlockedDate: "May 12, 2026",
  },
  {
    id: "first-shloka",
    name: "Prathamapāda",
    hint: "",
    desc: "You read your first complete Sanskrit verse — Ṛgveda 1.1.1.",
    pattern: "C",
    status: "unlocked",
    xp: 150,
    unlockedDate: "May 14, 2026",
  },
  {
    id: "streak-7",
    name: "Saptarātri",
    hint: "",
    desc: "Seven consecutive days of practice. The tradition holds.",
    pattern: "D",
    status: "unlocked",
    xp: 200,
    unlockedDate: "May 19, 2026",
  },
  {
    id: "streak-30",
    name: "Māsasādhana",
    hint: "Practice for 30 consecutive days.",
    desc: "Thirty days without breaking the chain.",
    pattern: "E",
    status: "locked",
    xp: 500,
  },
  {
    id: "gayatri",
    name: "Gāyatrīsiddhi",
    hint: "",
    desc: "You mastered the Gāyatrī Mantra — humanity's oldest recorded prayer.",
    pattern: "F",
    status: "unlocked",
    xp: 300,
    unlockedDate: "May 21, 2026",
  },
  {
    id: "ramayana-complete",
    name: "Rāmacarita",
    hint: "Complete the Rāmāyaṇa Book I curriculum.",
    desc: "Rāma's vow, completed. The first book of the first epic.",
    pattern: "G",
    status: "locked",
    xp: 800,
  },
  {
    id: "first-quiz-perfect",
    name: "Sarvajña",
    hint: "",
    desc: "A perfect score on your first lesson quiz — no mistakes, no mercy.",
    pattern: "H",
    status: "unlocked",
    xp: 100,
    unlockedDate: "May 13, 2026",
  },
  {
    id: "grammar-foundation",
    name: "Śabdaśāstra",
    hint: "Complete all foundational grammar modules.",
    desc: "The architecture of Sanskrit grammar — Pāṇini would approve.",
    pattern: "I",
    status: "locked",
    xp: 600,
  },
  {
    id: "10-shlokas",
    name: "Daśapāda",
    hint: "Learn ten complete verses.",
    desc: "Ten shlokas committed to memory. The library grows.",
    pattern: "J",
    status: "locked",
    xp: 400,
  },
  {
    id: "rigveda",
    name: "Ṛksamāpti",
    hint: "Complete the Ṛgveda curriculum.",
    desc: "The oldest hymns of humanity. You have heard them all.",
    pattern: "K",
    status: "locked",
    xp: 1200,
  },
  {
    id: "all-complete",
    name: "Mahāpandita",
    hint: "Complete every module in the knowledge map.",
    desc: "The map is fully illuminated. The path has become the destination.",
    pattern: "L",
    status: "locked",
    xp: 2000,
  },
]

/* ── Geometric patterns (SVG, derived from vedic meters) ── */

const PATTERNS: Record<string, (c: string) => React.JSX.Element> = {
  A: (c) => (
    <svg viewBox="0 0 60 60" width="60" height="60">
      <circle cx="30" cy="30" r="24" fill="none" stroke={c} strokeWidth="1.5" />
      <circle cx="30" cy="30" r="14" fill="none" stroke={c} strokeWidth="1" opacity={0.6} />
      <circle cx="30" cy="30" r="4" fill={c} />
    </svg>
  ),
  B: (c) => (
    <svg viewBox="0 0 60 60" width="60" height="60">
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i * 72 - 90) * (Math.PI / 180)
        const x = 30 + 22 * Math.cos(a)
        const y = 30 + 22 * Math.sin(a)
        return <circle key={i} cx={x} cy={y} r="5" fill={c} opacity={0.85} />
      })}
      <circle cx="30" cy="30" r="5" fill={c} />
    </svg>
  ),
  C: (c) => (
    <svg viewBox="0 0 60 60" width="60" height="60">
      <polygon points="30,6 54,54 6,54" fill="none" stroke={c} strokeWidth="1.5" />
      <polygon points="30,20 46,46 14,46" fill={c} opacity={0.2} />
      <circle cx="30" cy="36" r="4" fill={c} />
    </svg>
  ),
  D: (c) => (
    <svg viewBox="0 0 60 60" width="60" height="60">
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <line
          key={i}
          x1="30" y1="30"
          x2={30 + 22 * Math.cos((i * 51.43 - 90) * Math.PI / 180)}
          y2={30 + 22 * Math.sin((i * 51.43 - 90) * Math.PI / 180)}
          stroke={c} strokeWidth="1.5" opacity={0.7}
        />
      ))}
      <circle cx="30" cy="30" r="4" fill={c} />
    </svg>
  ),
  E: (c) => (
    <svg viewBox="0 0 60 60" width="60" height="60">
      {[6, 12, 18, 24, 30].map((r) => (
        <circle key={r} cx="30" cy="30" r={r} fill="none" stroke={c} strokeWidth="1" opacity={0.4 + r / 80} />
      ))}
      <circle cx="30" cy="30" r="4" fill={c} />
    </svg>
  ),
  F: (c) => (
    <svg viewBox="0 0 60 60" width="60" height="60">
      <polygon points="30,8 52,22 52,38 30,52 8,38 8,22" fill="none" stroke={c} strokeWidth="1.5" />
      <polygon points="30,18 44,26 44,34 30,42 16,34 16,26" fill={c} opacity={0.15} />
      <circle cx="30" cy="30" r="4" fill={c} />
    </svg>
  ),
  G: (c) => (
    <svg viewBox="0 0 60 60" width="60" height="60">
      <rect x="12" y="12" width="36" height="36" fill="none" stroke={c} strokeWidth="1.5" transform="rotate(0 30 30)" />
      <rect x="12" y="12" width="36" height="36" fill={c} opacity={0.1} transform="rotate(45 30 30)" />
      <circle cx="30" cy="30" r="4" fill={c} />
    </svg>
  ),
  H: (c) => (
    <svg viewBox="0 0 60 60" width="60" height="60">
      <polygon points="30,6 36,24 54,24 40,35 45,54 30,43 15,54 20,35 6,24 24,24" fill="none" stroke={c} strokeWidth="1.5" />
      <circle cx="30" cy="30" r="5" fill={c} opacity={0.6} />
    </svg>
  ),
  I: (c) => (
    <svg viewBox="0 0 60 60" width="60" height="60">
      <line x1="30" y1="8" x2="30" y2="52" stroke={c} strokeWidth="1.5" />
      <line x1="8" y1="30" x2="52" y2="30" stroke={c} strokeWidth="1.5" />
      <line x1="12" y1="12" x2="48" y2="48" stroke={c} strokeWidth="1" opacity={0.5} />
      <line x1="48" y1="12" x2="12" y2="48" stroke={c} strokeWidth="1" opacity={0.5} />
      <circle cx="30" cy="30" r="8" fill="none" stroke={c} strokeWidth="1.5" />
    </svg>
  ),
  J: (c) => (
    <svg viewBox="0 0 60 60" width="60" height="60">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => {
        const a = (i * 36 - 90) * Math.PI / 180
        return (
          <rect key={i}
            x={30 + 20 * Math.cos(a) - 3}
            y={30 + 20 * Math.sin(a) - 3}
            width="6" height="6"
            fill={c} opacity={0.65}
            transform={`rotate(${i * 36} ${30 + 20 * Math.cos(a)} ${30 + 20 * Math.sin(a)})`}
          />
        )
      })}
    </svg>
  ),
  K: (c) => (
    <svg viewBox="0 0 60 60" width="60" height="60">
      <circle cx="30" cy="30" r="24" fill="none" stroke={c} strokeWidth="1.5" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const a1 = (i * 45 - 90) * Math.PI / 180
        const a2 = ((i + 1) * 45 - 90) * Math.PI / 180
        return (
          <path key={i}
            d={`M 30 30 L ${30 + 24 * Math.cos(a1)} ${30 + 24 * Math.sin(a1)} L ${30 + 24 * Math.cos(a2)} ${30 + 24 * Math.sin(a2)} Z`}
            fill={i % 2 === 0 ? c : "none"}
            opacity={0.18}
            stroke={c} strokeWidth="0.5"
          />
        )
      })}
      <circle cx="30" cy="30" r="5" fill={c} />
    </svg>
  ),
  L: (c) => (
    <svg viewBox="0 0 60 60" width="60" height="60">
      {[8, 16, 24].map((r) => (
        <polygon key={r}
          points={[0, 1, 2, 3, 4, 5].map(i => {
            const a = (i * 60 - 90) * Math.PI / 180
            return `${30 + r * Math.cos(a)},${30 + r * Math.sin(a)}`
          }).join(" ")}
          fill="none" stroke={c} strokeWidth="1" opacity={1 - r / 36}
        />
      ))}
      <circle cx="30" cy="30" r="4" fill={c} />
    </svg>
  ),
}

function SutraCard({ sutra }: { sutra: Sutra }) {
  const unlocked = sutra.status === "unlocked"
  const patternColor = unlocked ? "var(--gold)" : "rgba(42,24,16,0.20)"
  const PatternFn = PATTERNS[sutra.pattern]

  return (
    <div
      style={{
        border: "1px solid var(--gold-line)",
        padding: "28px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        background: unlocked ? "var(--cream)" : "rgba(244,225,193,0.5)",
        opacity: unlocked ? 1 : 0.7,
        transition: "transform 200ms, box-shadow 200ms",
        cursor: unlocked ? "default" : "not-allowed",
        position: "relative",
        overflow: "hidden",
      }}
      className={unlocked ? "card-lift" : ""}
    >
      {/* Background pattern watermark */}
      <div
        style={{
          position: "absolute",
          bottom: -8,
          right: -8,
          opacity: 0.07,
          transform: "scale(2)",
          transformOrigin: "bottom right",
          pointerEvents: "none",
        }}
      >
        {PatternFn(unlocked ? "var(--brown)" : "var(--brown)")}
      </div>

      {/* Pattern icon */}
      <div style={{ opacity: unlocked ? 1 : 0.4 }}>
        {PatternFn(patternColor)}
      </div>

      {/* Name */}
      <div>
        {unlocked ? (
          <h3
            className="font-cinzel"
            style={{ fontSize: 16, fontWeight: 500, color: "var(--brown)", marginBottom: 4 }}
          >
            {sutra.name}
          </h3>
        ) : (
          <div
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 14,
              color: "var(--brown-faint)",
              letterSpacing: "0.08em",
              fontStyle: "italic",
              marginBottom: 4,
            }}
          >
            ???
          </div>
        )}

        <p
          className="font-manrope"
          style={{ fontSize: 13, color: "var(--brown-soft)", lineHeight: 1.5 }}
        >
          {unlocked ? sutra.desc : sutra.hint}
        </p>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <svg width="8" height="10" viewBox="0 0 8 10" fill="none">
            <path d="M4 0L7 4H5V10L1 6H3V0Z" fill={unlocked ? "var(--gold)" : "rgba(42,24,16,0.20)"} />
          </svg>
          <span
            className="font-cinzel"
            style={{ fontSize: 12, fontWeight: 600, color: unlocked ? "var(--gold)" : "var(--brown-faint)" }}
          >
            {sutra.xp} Shakti
          </span>
        </div>
        {unlocked && sutra.unlockedDate && (
          <span className="font-manrope" style={{ fontSize: 10, color: "var(--brown-faint)", letterSpacing: "0.06em" }}>
            {sutra.unlockedDate}
          </span>
        )}
        {!unlocked && (
          <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
            <rect x="1" y="6" width="10" height="7" rx="1" stroke="var(--brown-faint)" strokeWidth="1.2" />
            <path d="M3 6V4C3 2.343 4.343 1 6 1C7.657 1 9 2.343 9 4V6" stroke="var(--brown-faint)" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        )}
      </div>
    </div>
  )
}

export default function AchievementsPage() {
  const unlocked = SUTRAS.filter((s) => s.status === "unlocked").length

  return (
    <div style={{ minHeight: "100dvh", padding: "clamp(24px,4vw,48px) clamp(16px,4vw,48px)" }}>

      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Achievements</div>
        <h1
          className="font-cinzel"
          style={{ fontSize: "clamp(22px, 3.5vw, 36px)", fontWeight: 500, color: "var(--brown)", marginBottom: 16 }}
        >
          The Sutras
        </h1>
        <p
          className="font-manrope"
          style={{ fontSize: 15, color: "var(--brown-soft)", maxWidth: 480, lineHeight: 1.7 }}
        >
          A sūtra is a thread — a rule compressed to its essence. Each one you earn marks a moment when something clicked, when the ancient became yours.
        </p>
      </div>

      {/* Progress strip */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          padding: "20px 24px",
          border: "1px solid var(--gold-line)",
          marginBottom: 40,
          flexWrap: "wrap",
        }}
      >
        <div>
          <span
            className="font-cinzel"
            style={{ fontSize: 32, fontWeight: 700, color: "var(--brown)" }}
          >
            {unlocked}
          </span>
          <span
            className="font-manrope"
            style={{ fontSize: 14, color: "var(--brown-soft)", marginLeft: 8 }}
          >
            of {SUTRAS.length} Sutras discovered
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <div style={{ height: 3, background: "rgba(42,24,16,0.10)", borderRadius: 2 }}>
            <div
              style={{
                height: "100%",
                width: `${(unlocked / SUTRAS.length) * 100}%`,
                background: "var(--gold)",
                borderRadius: 2,
              }}
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 240px), 1fr))",
          gap: 16,
        }}
      >
        {SUTRAS.map((s) => (
          <SutraCard key={s.id} sutra={s} />
        ))}
      </div>

      {/* Empty state message if no unlocked */}
      {unlocked === 0 && (
        <div
          style={{ textAlign: "center", padding: "80px 24px" }}
          className="fade-in"
        >
          <div
            className="font-devanagari"
            style={{ fontSize: 48, color: "var(--gold)", marginBottom: 16, opacity: 0.6 }}
          >
            ॐ
          </div>
          <p className="font-cinzel" style={{ fontSize: 18, color: "var(--brown-soft)" }}>
            Your collection begins here.
          </p>
        </div>
      )}

    </div>
  )
}
