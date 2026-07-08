"use client"

import { useState } from "react"

type NodeStatus = "complete" | "active" | "locked"

interface SkillNode {
  id: string
  label: string
  sub: string
  x: number
  y: number
  status: NodeStatus
  icon: string
  time: string
  xp: number
  connects: string[]
}

const NODES: SkillNode[] = [
  /* Foundation */
  { id: "vowels", label: "Devanāgarī Vowels", sub: "Script", x: 480, y: 520, status: "complete", icon: "अ", time: "Completed", xp: 200, connects: ["consonants", "basic-vocab"] },

  /* Layer 2 */
  { id: "consonants", label: "Devanāgarī Consonants", sub: "Script", x: 280, y: 410, status: "active", icon: "क", time: "~40 min", xp: 300, connects: ["sandhi", "declension"] },
  { id: "basic-vocab", label: "Basic Vocabulary", sub: "Vocabulary", x: 680, y: 410, status: "complete", icon: "शब्द", time: "Completed", xp: 150, connects: ["sentences", "ramayana-1"] },

  /* Layer 3 */
  { id: "sandhi", label: "Basic Sandhi", sub: "Grammar", x: 160, y: 295, status: "locked", icon: "◇", time: "~35 min", xp: 250, connects: ["verb-conj", "sandhi-full"] },
  { id: "declension", label: "Noun Declension I", sub: "Grammar", x: 380, y: 295, status: "locked", icon: "◇", time: "~50 min", xp: 280, connects: ["verb-conj", "mahabharata"] },
  { id: "sentences", label: "Basic Sentences", sub: "Grammar", x: 600, y: 295, status: "locked", icon: "◇", time: "~25 min", xp: 180, connects: ["mahabharata"] },
  { id: "ramayana-1", label: "Rāmāyaṇa — Book I", sub: "Ramayana", x: 800, y: 295, status: "active", icon: "रा", time: "~2 hr", xp: 600, connects: ["ramayana-2"] },

  /* Layer 4 */
  { id: "verb-conj", label: "Verb Conjugation", sub: "Grammar", x: 220, y: 185, status: "locked", icon: "◇", time: "~60 min", xp: 350, connects: ["verbal-roots"] },
  { id: "mahabharata", label: "Mahābhārata Prologue", sub: "Mahabharata", x: 480, y: 185, status: "locked", icon: "◇", time: "~90 min", xp: 500, connects: ["rigveda"] },
  { id: "ramayana-2", label: "Rāmāyaṇa — Book II", sub: "Ramayana", x: 740, y: 185, status: "locked", icon: "◇", time: "~2.5 hr", xp: 700, connects: [] },

  /* Layer 5 */
  { id: "verbal-roots", label: "Verbal Roots", sub: "Grammar", x: 160, y: 80, status: "locked", icon: "◇", time: "~45 min", xp: 320, connects: ["panini"] },
  { id: "rigveda", label: "Ṛgveda Hymns", sub: "Vedas", x: 480, y: 80, status: "locked", icon: "◇", time: "~3 hr", xp: 800, connects: ["panini"] },
  { id: "panini", label: "Pāṇinian Grammar", sub: "Advanced", x: 740, y: 80, status: "locked", icon: "◇", time: "~5 hr", xp: 1200, connects: [] },
]

const NODE_MAP = Object.fromEntries(NODES.map((n) => [n.id, n]))

export default function ProgressPage() {
  const [hovered, setHovered] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<string>("All")

  const filters = ["All", "Script", "Grammar", "Ramayana", "Mahabharata", "Vedas", "Vocabulary", "Advanced"]

  const visibleNodes = activeFilter === "All"
    ? NODES
    : NODES.filter((n) => n.sub === activeFilter)

  const visibleIds = new Set(visibleNodes.map((n) => n.id))

  const hoveredNode = hovered ? NODE_MAP[hovered] : null

  const complete = NODES.filter((n) => n.status === "complete").length
  const total = NODES.length

  return (
    <div style={{ minHeight: "100dvh", padding: "clamp(24px,4vw,48px) clamp(16px,4vw,48px)" }}>

      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Your Journey</div>
        <h1
          className="font-cinzel"
          style={{ fontSize: "clamp(22px, 3.5vw, 36px)", fontWeight: 500, color: "var(--brown)", marginBottom: 16 }}
        >
          The Knowledge Map
        </h1>

        {/* Overall progress */}
        <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 24 }}>
            <div>
              <div className="font-cinzel" style={{ fontSize: 28, fontWeight: 700, color: "var(--brown)", lineHeight: 1 }}>
                {complete}
              </div>
              <div className="font-manrope" style={{ fontSize: 11, color: "var(--brown-faint)", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 4 }}>
                Complete
              </div>
            </div>
            <div>
              <div className="font-cinzel" style={{ fontSize: 28, fontWeight: 700, color: "var(--brown)", lineHeight: 1 }}>
                {NODES.filter((n) => n.status === "active").length}
              </div>
              <div className="font-manrope" style={{ fontSize: 11, color: "var(--brown-faint)", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 4 }}>
                In Progress
              </div>
            </div>
            <div>
              <div className="font-cinzel" style={{ fontSize: 28, fontWeight: 700, color: "var(--brown)", lineHeight: 1 }}>
                {total - complete - NODES.filter((n) => n.status === "active").length}
              </div>
              <div className="font-manrope" style={{ fontSize: 11, color: "var(--brown-faint)", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 4 }}>
                Locked
              </div>
            </div>
          </div>

          {/* Overall bar */}
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ height: 3, background: "rgba(42,24,16,0.10)", borderRadius: 2 }}>
              <div
                style={{
                  height: "100%",
                  width: `${(complete / total) * 100}%`,
                  background: "var(--gold)",
                  borderRadius: 2,
                  transition: "width 800ms ease-out",
                }}
              />
            </div>
            <div className="font-manrope" style={{ fontSize: 11, color: "var(--brown-faint)", marginTop: 4 }}>
              {Math.round((complete / total) * 100)}% of the map illuminated
            </div>
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.08em",
              padding: "6px 14px",
              border: activeFilter === f ? "1px solid var(--gold)" : "1px solid var(--gold-line)",
              background: activeFilter === f ? "rgba(214,168,79,0.10)" : "transparent",
              color: activeFilter === f ? "var(--gold)" : "var(--brown-soft)",
              cursor: "pointer",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Skill tree canvas */}
      <div
        style={{
          border: "1px solid var(--gold-line)",
          background: "rgba(244,225,193,0.4)",
          overflow: "auto",
          position: "relative",
        }}
      >
        <svg
          width="960"
          height="600"
          viewBox="0 0 960 600"
          style={{ display: "block", minWidth: 640 }}
        >
          {/* Connection paths */}
          {NODES.map((node) =>
            node.connects.map((targetId) => {
              const target = NODE_MAP[targetId]
              if (!target) return null
              const bothVisible = visibleIds.has(node.id) && visibleIds.has(targetId)
              const bothComplete = node.status === "complete" && target.status === "complete"
              return (
                <line
                  key={`${node.id}-${targetId}`}
                  x1={node.x}
                  y1={node.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={
                    !bothVisible
                      ? "transparent"
                      : bothComplete
                      ? "var(--gold)"
                      : "rgba(214,168,79,0.25)"
                  }
                  strokeWidth={bothComplete ? 1.5 : 1}
                  strokeDasharray={bothComplete ? "none" : "4 4"}
                />
              )
            })
          )}

          {/* Nodes */}
          {NODES.map((node) => {
            const isVisible = visibleIds.has(node.id)
            const isHovered = hovered === node.id

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                style={{ cursor: "pointer", opacity: isVisible ? 1 : 0.2, transition: "opacity 200ms" }}
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Outer ring for active */}
                {node.status === "active" && (
                  <circle
                    r={34}
                    fill="none"
                    stroke="var(--gold)"
                    strokeWidth="1"
                    strokeDasharray="6 4"
                    opacity={0.5}
                  >
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0"
                      to="360"
                      dur="12s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Main circle */}
                <circle
                  r={28}
                  fill={
                    node.status === "complete"
                      ? "var(--gold)"
                      : node.status === "active"
                      ? "var(--cream)"
                      : "rgba(244,225,193,0.6)"
                  }
                  stroke={
                    node.status === "complete"
                      ? "var(--gold)"
                      : node.status === "active"
                      ? "var(--gold)"
                      : "var(--gold-line)"
                  }
                  strokeWidth={node.status === "complete" ? 0 : 1.5}
                  style={{
                    filter: isHovered ? "drop-shadow(0 4px 12px rgba(214,168,79,0.4))" : "none",
                    transition: "filter 150ms",
                  }}
                />

                {/* Icon text */}
                {node.status === "locked" ? (
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="14"
                    fill="var(--gold-line)"
                  >
                    ⌑
                  </text>
                ) : (
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="16"
                    fontFamily="'Noto Sans Devanagari', serif"
                    fill={node.status === "complete" ? "var(--cream)" : "var(--brown)"}
                    fontWeight="500"
                  >
                    {node.icon}
                  </text>
                )}

                {/* Label below */}
                <text
                  y={38}
                  textAnchor="middle"
                  fontSize="9"
                  fontFamily="'Manrope', sans-serif"
                  fontWeight="600"
                  letterSpacing="0.06em"
                  fill={node.status === "locked" ? "var(--brown-faint)" : "var(--brown-soft)"}
                  style={{ textTransform: "uppercase" }}
                >
                  {node.label.length > 18 ? node.label.slice(0, 16) + "…" : node.label}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Tooltip */}
        {hoveredNode && (
          <div
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              width: 220,
              border: "1px solid var(--gold-line)",
              background: "var(--cream)",
              padding: "18px 20px",
              boxShadow: "0 8px 32px rgba(42,24,16,0.10)",
              zIndex: 10,
            }}
          >
            <div className="eyebrow" style={{ fontSize: 9, marginBottom: 8 }}>{hoveredNode.sub}</div>
            <div className="font-cinzel" style={{ fontSize: 15, fontWeight: 500, color: "var(--brown)", marginBottom: 6, lineHeight: 1.3 }}>
              {hoveredNode.label}
            </div>
            <div className="font-manrope" style={{ fontSize: 12, color: "var(--brown-soft)", marginBottom: 12 }}>
              {hoveredNode.status === "complete"
                ? "Completed"
                : hoveredNode.status === "active"
                ? `In progress · ${hoveredNode.time}`
                : `Locked · ${hoveredNode.time}`}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="8" height="10" viewBox="0 0 8 10" fill="none">
                <path d="M4 0L7 4H5V10L1 6H3V0Z" fill="var(--gold)" />
              </svg>
              <span className="font-cinzel" style={{ fontSize: 12, color: "var(--gold)", fontWeight: 500 }}>
                {hoveredNode.xp} Shakti
              </span>
            </div>
            {hoveredNode.status !== "locked" && (
              <div
                style={{
                  marginTop: 12,
                  fontSize: 11,
                  fontFamily: "'Manrope', sans-serif",
                  color: hoveredNode.status === "complete" ? "var(--gold)" : "var(--pink)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: hoveredNode.status === "complete" ? "var(--gold)" : "var(--pink)",
                  }}
                />
                {hoveredNode.status === "complete" ? "Complete" : "In progress"}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 24, marginTop: 16, flexWrap: "wrap" }}>
        {[
          { color: "var(--gold)", label: "Complete" },
          { color: "var(--cream)", border: "var(--gold)", label: "In Progress" },
          { color: "rgba(244,225,193,0.6)", border: "var(--gold-line)", label: "Locked" },
        ].map(({ color, border, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: color,
                border: border ? `1.5px solid ${border}` : "none",
              }}
            />
            <span className="font-manrope" style={{ fontSize: 12, color: "var(--brown-soft)" }}>
              {label}
            </span>
          </div>
        ))}
      </div>

    </div>
  )
}
