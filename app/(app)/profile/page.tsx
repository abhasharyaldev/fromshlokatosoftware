import { requireSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export default async function ProfilePage() {
  const user = await requireSession()

  const [progress, achievements] = await Promise.all([
    prisma.userProgress.count({ where: { userId: user.id } }),
    prisma.achievement.count({ where: { userId: user.id } }),
  ])

  const memberSince = await prisma.user.findUnique({
    where: { id: user.id },
    select: { createdAt: true },
  })

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "clamp(24px,4vw,56px) clamp(16px,4vw,48px)" }}>
      <div className="eyebrow" style={{ marginBottom: 12 }}>Profile</div>
      <h1 className="font-cinzel" style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 700, color: "var(--brown)", marginBottom: 32, letterSpacing: "-0.01em" }}>
        {user.username}
      </h1>

      {/* Big avatar + basics */}
      <div style={{ display: "flex", gap: 24, alignItems: "center", marginBottom: 40, flexWrap: "wrap" }}>
        <div style={{
          width: 96, height: 96, borderRadius: "50%",
          background: "var(--burgundy)", color: "var(--cream)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Cinzel', serif", fontSize: 40, fontWeight: 700,
        }}>
          {user.username[0].toUpperCase()}
        </div>
        <div>
          <div className="font-cinzel" style={{ fontSize: 22, fontWeight: 600, color: "var(--brown)", marginBottom: 4 }}>
            {user.username}
          </div>
          <div className="font-manrope" style={{ fontSize: 13, color: "var(--brown-soft)" }}>
            {user.email}
          </div>
          {memberSince && (
            <div className="font-manrope" style={{ fontSize: 12, color: "var(--brown-faint)", marginTop: 6 }}>
              Sādhaka since {memberSince.createdAt.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </div>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 1, background: "var(--gold-line)", border: "1px solid var(--gold-line)" }}>
        {[
          { label: "Level",         value: user.level, color: "var(--brown)" },
          { label: "Shakti (XP)",   value: user.xp.toLocaleString(), color: "var(--gold)" },
          { label: "Battle ELO",    value: user.eloRating, color: "var(--burgundy)" },
          { label: "Day Streak",    value: `${user.streakDays}d`, color: "var(--pink)" },
          { label: "Lessons Done",  value: progress, color: "var(--brown)" },
          { label: "Achievements",  value: achievements, color: "var(--gold)" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "var(--cream)", padding: "20px 22px" }}>
            <div className="eyebrow" style={{ marginBottom: 8, fontSize: 10 }}>{label}</div>
            <div className="font-cinzel" style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
