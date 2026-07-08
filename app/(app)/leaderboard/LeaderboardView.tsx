"use client"

import { useState } from "react"

export interface LeaderRow {
  rank: number
  username: string
  level: number
  xp: number
  eloRating: number
}

interface Props {
  xpRows: LeaderRow[]
  eloRows: LeaderRow[]
  currentUsername: string | null
}

type Tab = "xp" | "elo"

export function LeaderboardView({ xpRows, eloRows, currentUsername }: Props) {
  const [tab, setTab] = useState<Tab>("xp")
  const rows = tab === "xp" ? xpRows : eloRows

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "clamp(24px,4vw,56px) clamp(16px,4vw,48px)" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Rankings</div>
        <h1
          className="font-cinzel"
          style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 700, color: "var(--brown)", letterSpacing: "-0.01em", lineHeight: 1.15 }}
        >
          Leaderboard
        </h1>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "1px solid var(--gold-line)" }}
      >
        <TabButton active={tab === "xp"}  onClick={() => setTab("xp")}  label="Shakti (XP)" />
        <TabButton active={tab === "elo"} onClick={() => setTab("elo")} label="Battle ELO" />
      </div>

      {/* Column headers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "60px 1fr 80px 100px",
          gap: 16,
          padding: "10px 20px",
          borderBottom: "1px solid var(--gold-line)",
        }}
      >
        <span className="eyebrow" style={{ fontSize: 9 }}>Rank</span>
        <span className="eyebrow" style={{ fontSize: 9 }}>Sādhaka</span>
        <span className="eyebrow" style={{ fontSize: 9, textAlign: "right" }}>Level</span>
        <span className="eyebrow" style={{ fontSize: 9, textAlign: "right" }}>
          {tab === "xp" ? "Shakti" : "ELO"}
        </span>
      </div>

      {/* Rows */}
      {rows.length === 0 ? (
        <div style={{ padding: "48px 20px", textAlign: "center" }}>
          <p className="font-manrope" style={{ fontSize: 14, color: "var(--brown-soft)" }}>
            No sādhakas yet. Be the first to top the rankings.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {rows.map((row) => {
            const isMe = currentUsername !== null && row.username === currentUsername
            const value = tab === "xp" ? row.xp : row.eloRating

            return (
              <div
                key={`${tab}-${row.username}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "60px 1fr 80px 100px",
                  gap: 16,
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--gold-line)",
                  background: isMe ? "rgba(214,168,79,0.08)" : "transparent",
                  borderLeft: isMe ? "3px solid var(--gold)" : "3px solid transparent",
                  alignItems: "center",
                }}
              >
                {/* Rank */}
                <span
                  className="font-cinzel"
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: row.rank <= 3 ? "var(--gold)" : "var(--brown-faint)",
                  }}
                >
                  {row.rank === 1 ? "1st" : row.rank === 2 ? "2nd" : row.rank === 3 ? "3rd" : `${row.rank}`}
                </span>

                {/* Username + avatar */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <div
                    style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: isMe ? "var(--gold)" : "var(--burgundy)",
                      color: "var(--cream)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {row.username[0].toUpperCase()}
                  </div>
                  <span
                    className="font-manrope"
                    style={{
                      fontSize: 14,
                      fontWeight: isMe ? 700 : 500,
                      color: "var(--brown)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.username}
                    {isMe && (
                      <span
                        className="eyebrow"
                        style={{ marginLeft: 8, fontSize: 9, color: "var(--gold)" }}
                      >
                        You
                      </span>
                    )}
                  </span>
                </div>

                {/* Level */}
                <span
                  className="font-cinzel"
                  style={{ fontSize: 14, fontWeight: 600, color: "var(--brown-soft)", textAlign: "right" }}
                >
                  {row.level}
                </span>

                {/* Value */}
                <span
                  className="font-cinzel"
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: tab === "xp" ? "var(--gold)" : "var(--burgundy)",
                    textAlign: "right",
                  }}
                >
                  {value.toLocaleString()}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Footer note */}
      <p
        className="font-manrope"
        style={{ marginTop: 32, fontSize: 12, color: "var(--brown-faint)", textAlign: "center", fontStyle: "italic" }}
      >
        Top 50 · Updated in real time
      </p>
    </div>
  )
}

function TabButton({
  active, onClick, label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={active}
      style={{
        fontFamily: "'Manrope', sans-serif",
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: active ? "var(--gold)" : "var(--brown-faint)",
        background: "transparent",
        border: "none",
        borderBottom: active ? "2px solid var(--gold)" : "2px solid transparent",
        marginBottom: -1,
        padding: "14px 24px",
        cursor: "pointer",
        transition: "color 120ms, border-color 120ms",
      }}
    >
      {label}
    </button>
  )
}
