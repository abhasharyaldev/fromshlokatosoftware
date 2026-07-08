import { notFound } from "next/navigation"
import { requireSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { ProfileActions } from "./ProfileActions"
import { buildAchievementDisplay } from "@/lib/achievements"

interface Params {
  params: Promise<{ username: string }>
}

export default async function ProfilePage({ params }: Params) {
  const { username } = await params

  const [session, profile] = await Promise.all([
    requireSession(),
    prisma.user.findUnique({
      where:  { username },
      select: {
        id:         true,
        username:   true,
        level:      true,
        xp:         true,
        eloRating:  true,
        streakDays: true,
        createdAt:  true,
      },
    }),
  ])

  if (!profile) notFound()

  const isMe = profile.id === session.id

  // Fetch everything in parallel — friendship, achievements, lesson count, battle stats
  const [friendship, earnedRaw, completedLessons, battlesWon, battlesDrawn, battlesTotal] =
    await Promise.all([
      isMe
        ? Promise.resolve(null)
        : prisma.friendship.findFirst({
            where: {
              OR: [
                { userId: session.id, friendId: profile.id },
                { userId: profile.id, friendId: session.id },
              ],
            },
            select: { id: true, status: true, userId: true, friendId: true },
          }),

      prisma.achievement.findMany({
        where:   { userId: profile.id },
        select:  { achievementKey: true, earnedAt: true },
        orderBy: { earnedAt: "asc" },
      }),

      prisma.userProgress.count({ where: { userId: profile.id } }),

      prisma.battle.count({
        where: {
          status:   "finished",
          winnerId: profile.id,
        },
      }),

      // Draws: finished, both players participated, no winner
      prisma.battle.count({
        where: {
          status:   "finished",
          winnerId: null,
          OR: [{ player1Id: profile.id }, { player2Id: profile.id }],
        },
      }),

      prisma.battle.count({
        where: {
          status: "finished",
          OR: [{ player1Id: profile.id }, { player2Id: profile.id }],
        },
      }),
    ])

  const battlesLost   = battlesTotal - battlesWon - battlesDrawn
  const winRatePct    = battlesTotal > 0
    ? Math.round((battlesWon / battlesTotal) * 100)
    : null

  const achievements  = buildAchievementDisplay(
    earnedRaw.map((a) => ({ achievementKey: a.achievementKey, earnedAt: a.earnedAt })),
  )
  const earnedCount   = achievements.filter((a) => a.earned).length

  // Derive viewer → profile relationship
  type Relation = "self" | "friends" | "pending_sent" | "pending_received" | "none"
  let relation: Relation = "none"
  if (isMe) {
    relation = "self"
  } else if (friendship?.status === "accepted") {
    relation = "friends"
  } else if (friendship?.status === "pending") {
    relation = friendship.userId === session.id ? "pending_sent" : "pending_received"
  }

  const joinedYear = profile.createdAt.getFullYear()

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "clamp(24px,4vw,56px) clamp(16px,4vw,48px)",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: "flex", alignItems: "flex-start", gap: 24,
          marginBottom: 40, flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: 80, height: 80, borderRadius: "50%",
            background: isMe ? "var(--gold)" : "var(--burgundy)",
            color: "var(--cream)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Cinzel', serif", fontSize: 34, fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {profile.username[0].toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            {isMe ? "Your Profile" : "Sādhaka"}
          </div>
          <h1
            className="font-cinzel"
            style={{
              fontSize: "clamp(24px,4vw,38px)", fontWeight: 700,
              color: "var(--brown)", lineHeight: 1.15, marginBottom: 6,
            }}
          >
            {profile.username}
          </h1>
          <p className="font-manrope" style={{ fontSize: 12, color: "var(--brown-faint)" }}>
            Level {profile.level} · Joined {joinedYear} · {earnedCount}/{achievements.length} achievements
          </p>
        </div>

        {!isMe && (
          <ProfileActions
            profileUserId={profile.id}
            relation={relation}
            requestId={friendship?.id ?? null}
          />
        )}
      </div>

      {/* ── Core stats ── */}
      <div style={{ marginBottom: 2 }}>
        <div className="eyebrow" style={{ marginBottom: 12, fontSize: 10 }}>Stats</div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 1, background: "var(--gold-line)",
          border: "1px solid var(--gold-line)",
          marginBottom: 40,
        }}
      >
        <StatCell label="Level"         value={profile.level.toString()}         accent="var(--brown)" />
        <StatCell label="Shakti (XP)"   value={profile.xp.toLocaleString()}      accent="var(--gold)" />
        <StatCell label="Battle Rating" value={profile.eloRating.toString()}      accent="var(--burgundy)" />
        <StatCell label="Day Streak"    value={`${profile.streakDays}d`}         accent="var(--pink)" />
        <StatCell label="Lessons Done"  value={completedLessons.toString()}       accent="var(--gold)" />
        <StatCell label="Battles"       value={battlesTotal.toString()}           accent="var(--brown)" />
        <StatCell
          label="W / D / L"
          value={battlesTotal > 0
            ? `${battlesWon} / ${battlesDrawn} / ${battlesLost}`
            : "—"}
          accent="var(--burgundy)"
        />
        <StatCell
          label="Win Rate"
          value={winRatePct !== null ? `${winRatePct}%` : "—"}
          accent={winRatePct !== null && winRatePct >= 50 ? "var(--gold)" : "var(--brown-soft)"}
        />
      </div>

      {/* ── Achievements ── */}
      <div style={{ marginBottom: 40 }}>
        <div
          style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "baseline", marginBottom: 12,
          }}
        >
          <div className="eyebrow" style={{ fontSize: 10 }}>Achievements</div>
          <span className="font-manrope" style={{ fontSize: 12, color: "var(--brown-faint)" }}>
            {earnedCount} / {achievements.length}
          </span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%,260px),1fr))",
            gap: 1, background: "var(--gold-line)",
            border: "1px solid var(--gold-line)",
          }}
        >
          {achievements.map((a) => (
            <div
              key={a.key}
              style={{
                display: "flex", alignItems: "flex-start", gap: 14,
                padding: "16px 20px",
                background: a.earned ? "var(--cream)" : "rgba(42,24,16,0.02)",
                opacity: a.earned ? 1 : 0.42,
              }}
            >
              <div
                style={{
                  width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                  background: a.earned ? "var(--gold)" : "var(--gold-line)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <AchievementIcon category={a.category} earned={a.earned} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  className="font-cinzel"
                  style={{ fontSize: 12, fontWeight: 600, color: "var(--brown)", marginBottom: 3 }}
                >
                  {a.title}
                </div>
                <div
                  className="font-manrope"
                  style={{ fontSize: 11, color: "var(--brown-soft)", lineHeight: 1.4 }}
                >
                  {a.description}
                </div>
                {a.earnedAt && (
                  <div
                    className="font-manrope"
                    style={{ fontSize: 10, color: "var(--gold)", marginTop: 4 }}
                  >
                    {new Date(a.earnedAt).toLocaleDateString(undefined, {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Challenge (friends only) ── */}
      {!isMe && relation === "friends" && (
        <div
          style={{
            border: "1px solid var(--gold-line)",
            padding: "24px 28px",
            background: "linear-gradient(135deg, rgba(214,168,79,0.06) 0%, transparent 60%)",
          }}
        >
          <div className="eyebrow" style={{ marginBottom: 12, fontSize: 10 }}>Challenge</div>
          <p
            className="font-manrope"
            style={{ fontSize: 14, color: "var(--brown-soft)", marginBottom: 16 }}
          >
            Create a private battle room and share the code with {profile.username}.
          </p>
          <a
            href="/battle"
            className="btn-gold"
            style={{
              fontSize: 12, padding: "12px 32px",
              textDecoration: "none", display: "inline-block",
            }}
          >
            Go to Battle →
          </a>
        </div>
      )}
    </div>
  )
}

// ── UI helpers ────────────────────────────────────────────────────────────────

function StatCell({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{ background: "var(--cream)", padding: "18px 22px" }}>
      <div className="eyebrow" style={{ marginBottom: 7, fontSize: 9 }}>{label}</div>
      <div
        className="font-cinzel"
        style={{ fontSize: "clamp(18px,2.5vw,26px)", fontWeight: 700, color: accent, lineHeight: 1 }}
      >
        {value}
      </div>
    </div>
  )
}

function AchievementIcon({ category, earned }: { category: string; earned: boolean }) {
  const color = earned ? "var(--cream)" : "var(--brown-faint)"
  const size  = 16
  if (category === "battle") {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <polygon
          points="8,1 15,15 1,15"
          stroke={color} strokeWidth="1.5"
          fill="none" strokeLinejoin="round"
        />
      </svg>
    )
  }
  if (category === "dedication") {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <path
          d="M8 2 L9.8 6.5 L14.5 6.5 L10.8 9.5 L12.2 14 L8 11 L3.8 14 L5.2 9.5 L1.5 6.5 L6.2 6.5 Z"
          stroke={color} strokeWidth="1.2" fill="none" strokeLinejoin="round"
        />
      </svg>
    )
  }
  if (category === "progression") {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <path
          d="M2 13 L6 8 L10 10 L14 3"
          stroke={color} strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
    )
  }
  // learning / default
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="12" height="12" rx="1" stroke={color} strokeWidth="1.5" />
      <path
        d="M5 8 L7 10 L11 6"
        stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  )
}
