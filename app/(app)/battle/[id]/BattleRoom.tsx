"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { io, type Socket } from "socket.io-client"
import type { BattleView } from "@/lib/battle"

// ── Local UI-only state (in addition to server-authoritative view) ────────────

interface RoundResult {
  roundIndex:    number
  correctAnswer: string
  explanation:   string | null
  players:       { userId: string; correct: boolean }[]
}

export function BattleRoom({ initial }: { initial: BattleView }) {
  const [view, setView]         = useState<BattleView>(initial)
  const [selected, setSelected] = useState<string>("")
  const [answered, setAnswered] = useState(false)
  const [starting, setStarting] = useState(false)
  const [startingErr, setStartingErr] = useState<string | null>(null)
  const [socketErr, setSocketErr] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [opponentLeft, setOpponentLeft] = useState(false)
  const [roundResult, setRoundResult]   = useState<RoundResult | null>(null)
  const [roundDeadline, setRoundDeadline] = useState<number | null>(null)
  const [now, setNow]           = useState(() => Date.now())
  const [copied, setCopied]     = useState(false)

  const socketRef = useRef<Socket | null>(null)

  // ── Connect on mount (fetch token, then open socket) ──────────────────────
  useEffect(() => {
    let cancelled = false

    async function connect() {
      try {
        const r = await fetch("/api/socket/token", { method: "POST" })
        if (!r.ok) throw new Error("Could not authorize realtime session.")
        const { token, url } = await r.json()
        if (cancelled) return

        const s = io(url, {
          auth: { token },
          transports: ["websocket", "polling"],
          reconnectionAttempts: 5,
        })
        socketRef.current = s

        s.on("connect",    () => { setConnected(true); setSocketErr(null) })
        s.on("disconnect", () => setConnected(false))
        s.on("connect_error", (err) => setSocketErr(err.message))

        // Join the battle room
        s.emit("battle:join", { battleId: view.id }, (res: { ok: boolean; error?: string; view?: BattleView }) => {
          if (!res.ok) { setSocketErr(res.error ?? "Join failed"); return }
          if (res.view) setView(res.view)
          // If already active, tell server we're ready — this may kick off the first round
          if (res.view?.status === "active") {
            s.emit("battle:ready", { battleId: view.id })
          }
        })

        // ── Server events ────────────────────────────────────────────────
        s.on("battle:started", ({ view: v, roundDeadline }: { view: BattleView; roundDeadline: number }) => {
          setView(v); setRoundDeadline(roundDeadline); setAnswered(false); setRoundResult(null); setSelected("")
        })

        s.on("battle:next_round", ({ view: v, roundDeadline }: { view: BattleView; roundDeadline: number }) => {
          setView(v); setRoundDeadline(roundDeadline); setAnswered(false); setRoundResult(null); setSelected("")
        })

        s.on("battle:round_result", (r: RoundResult) => {
          setRoundResult(r)
          setRoundDeadline(null)
        })

        s.on("battle:ended", ({ view: v }: { view: BattleView }) => {
          setView(v); setRoundDeadline(null); setRoundResult(null)
        })

        s.on("battle:opponent_left", () => setOpponentLeft(true))
      } catch (e) {
        if (!cancelled) setSocketErr(e instanceof Error ? e.message : "Realtime failed to start.")
      }
    }

    void connect()

    return () => {
      cancelled = true
      socketRef.current?.disconnect()
      socketRef.current = null
    }
    // Only run once — view.id is stable for the page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.id])

  // ── Live countdown timer ──────────────────────────────────────────────────
  useEffect(() => {
    if (!roundDeadline) return
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [roundDeadline])

  const secondsLeft = roundDeadline ? Math.max(0, Math.ceil((roundDeadline - now) / 1000)) : null

  // ── Actions ──────────────────────────────────────────────────────────────
  async function handleStart() {
    setStarting(true); setStartingErr(null)
    try {
      const res = await fetch(`/api/battles/${view.id}/start`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to start.")
      // After starting, tell socket server we're ready
      socketRef.current?.emit("battle:ready", { battleId: view.id })
      // Local optimistic view update — socket will send authoritative state
      if (data.battle) setView(data.battle)
    } catch (e) {
      setStartingErr(e instanceof Error ? e.message : "Failed to start.")
    } finally {
      setStarting(false)
    }
  }

  function handleAnswer() {
    if (!selected || answered || !socketRef.current) return
    setAnswered(true)
    socketRef.current.emit(
      "battle:answer",
      { roundIndex: view.currentRoundIndex, answer: selected },
      (res: { ok: boolean; error?: string }) => {
        if (!res.ok) {
          setAnswered(false)
          setSocketErr(res.error ?? "Answer rejected.")
        }
      }
    )
  }

  async function copyCode() {
    await navigator.clipboard.writeText(view.roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  // ── Render: waiting for opponent ─────────────────────────────────────────
  if (view.status === "waiting") {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "clamp(24px,4vw,56px) clamp(16px,4vw,48px)", textAlign: "center" }}>
        <Link href="/battle" className="font-manrope" style={{ fontSize: 12, color: "var(--brown-faint)", textDecoration: "none", display: "block", marginBottom: 40 }}>
          ← Battle Home
        </Link>

        <ConnectionBadge connected={connected} error={socketErr} />

        <div className="eyebrow" style={{ marginBottom: 16 }}>Room code</div>
        <button
          onClick={copyCode}
          style={{
            fontFamily: "'Cinzel', serif", fontSize: "clamp(48px, 10vw, 88px)",
            fontWeight: 700, color: "var(--gold)", letterSpacing: "0.15em",
            background: "transparent", border: "none", cursor: "pointer",
            marginBottom: 8, padding: 0,
          }}
        >{view.roomCode}</button>
        <p className="font-manrope" style={{ fontSize: 12, color: "var(--brown-faint)", marginBottom: 40 }}>
          {copied ? "Copied to clipboard" : "Click to copy · Share this code with your opponent"}
        </p>

        {view.opponent ? (
          <>
            <div style={{ marginBottom: 32, padding: "24px", border: "1px solid var(--gold-line)" }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Opponent joined</div>
              <p className="font-cinzel" style={{ fontSize: 22, fontWeight: 500, color: "var(--brown)" }}>
                {view.opponent.username}
              </p>
            </div>
            {view.canStart ? (
              <>
                {startingErr && <p style={{ color: "#9b3535", fontSize: 13, marginBottom: 16 }}>{startingErr}</p>}
                <button onClick={handleStart} disabled={starting} className="btn-gold" style={{ fontSize: 13, padding: "16px 48px" }}>
                  {starting ? "Starting…" : "Begin Battle"}
                </button>
              </>
            ) : (
              <p className="font-manrope" style={{ fontSize: 14, color: "var(--brown-soft)" }}>
                Waiting for the room creator to start…
              </p>
            )}
          </>
        ) : (
          <div style={{ padding: "32px", border: "1px dashed var(--gold-line)" }}>
            <div className="font-devanagari" style={{ fontSize: 40, color: "var(--gold)", opacity: 0.6, marginBottom: 12 }}>ॐ</div>
            <p className="font-manrope" style={{ fontSize: 14, color: "var(--brown-soft)" }}>Waiting for an opponent to join…</p>
          </div>
        )}
      </div>
    )
  }

  // ── Render: finished ─────────────────────────────────────────────────────
  if (view.status === "finished") {
    const headline = view.outcome === "win" ? "Victory" : view.outcome === "loss" ? "Defeat" : "Draw"
    const headlineColor = view.outcome === "win" ? "var(--gold)" : view.outcome === "loss" ? "var(--pink)" : "var(--brown)"

    return (
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "clamp(24px,4vw,56px) clamp(16px,4vw,48px)" }}>
        <div style={{ textAlign: "center", marginBottom: 40, paddingBottom: 32, borderBottom: "1px solid var(--gold-line)" }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>Battle complete</div>
          <h1 className="font-cinzel" style={{ fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 700, color: headlineColor }}>{headline}</h1>
          <div style={{ display: "flex", justifyContent: "center", gap: 40, marginTop: 32, flexWrap: "wrap" }}>
            <ScoreCol label={`${view.me.username} (you)`} score={view.me.score} total={view.totalRounds} highlight={view.outcome === "win"} />
            <ScoreCol label={view.opponent?.username ?? "—"} score={view.opponent?.score ?? 0} total={view.totalRounds} highlight={view.outcome === "loss"} />
          </div>
          {view.me.eloAfter !== undefined && (
            <div style={{ marginTop: 24 }}>
              <div className="eyebrow" style={{ fontSize: 10, marginBottom: 4 }}>New Battle Rating</div>
              <div className="font-cinzel" style={{ fontSize: 24, fontWeight: 700, color: "var(--burgundy)" }}>{view.me.eloAfter}</div>
            </div>
          )}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 32, flexWrap: "wrap" }}>
            <Link href="/battle" className="btn-gold" style={{ fontSize: 12, padding: "13px 32px" }}>Play Again</Link>
            <Link href="/dashboard" className="btn-ghost" style={{ fontSize: 12, padding: "13px 32px" }}>Dashboard</Link>
          </div>
        </div>
        <div className="eyebrow" style={{ marginBottom: 16 }}>Review</div>
        {view.completedRounds.map((r) => <RoundReview key={r.index} r={r} />)}
      </div>
    )
  }

  // ── Render: active battle ────────────────────────────────────────────────
  const progress = (view.currentRoundIndex / view.totalRounds) * 100

  return (
    <div style={{ minHeight: "100dvh", background: "var(--cream)" }}>
      <div className="lesson-progress"><div className="lesson-progress-fill" style={{ width: `${progress}%` }} /></div>

      <div style={{
        position: "fixed", top: 4, left: 0, right: 0, height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", background: "var(--cream)", borderBottom: "1px solid var(--gold-line)", zIndex: 90,
      }}>
        <ScoreChip label={view.me.username} score={view.me.score} me />
        <div style={{ textAlign: "center" }}>
          <div className="eyebrow" style={{ fontSize: 10 }}>Round {view.currentRoundIndex + 1} / {view.totalRounds}</div>
          {secondsLeft !== null && (
            <div className="font-cinzel" style={{ fontSize: 18, fontWeight: 700, color: secondsLeft <= 5 ? "var(--pink)" : "var(--brown)" }}>
              {secondsLeft}s
            </div>
          )}
        </div>
        <ScoreChip label={view.opponent?.username ?? "—"} score={view.opponent?.score ?? 0} />
      </div>

      {opponentLeft && (
        <div style={{ position: "fixed", top: 64, left: 0, right: 0, background: "rgba(201,138,125,0.14)", padding: "10px 24px", textAlign: "center", zIndex: 80 }}>
          <p className="font-manrope" style={{ fontSize: 13, color: "#9b3535" }}>
            Your opponent has disconnected.
          </p>
        </div>
      )}

      <ConnectionBadge connected={connected} error={socketErr} floating />

      <div style={{ maxWidth: 620, margin: "0 auto", padding: "96px 24px 40px" }}>
        {/* Round result banner */}
        {roundResult && (
          <div className="fade-in" style={{
            marginBottom: 24, padding: "16px 20px",
            background: "rgba(214,168,79,0.08)",
            border: "1px solid var(--gold-line)",
          }}>
            <div className="eyebrow" style={{ marginBottom: 8, fontSize: 10 }}>Round {roundResult.roundIndex + 1} result</div>
            <p className="font-manrope" style={{ fontSize: 14, color: "var(--brown)" }}>
              Correct answer: <strong style={{ color: "var(--gold)" }}>{roundResult.correctAnswer}</strong>
            </p>
            {roundResult.explanation && (
              <p className="font-manrope" style={{ fontSize: 13, color: "var(--brown-soft)", marginTop: 8, lineHeight: 1.6 }}>
                {roundResult.explanation}
              </p>
            )}
            <p className="font-manrope" style={{ fontSize: 12, color: "var(--brown-faint)", marginTop: 12 }}>
              Next round in a moment…
            </p>
          </div>
        )}

        {view.currentQuestion && !roundResult && !answered && (
          <>
            <div className="eyebrow" style={{ textAlign: "center", marginBottom: 24 }}>Choose the correct answer</div>
            <h2 className="font-cinzel" style={{ fontSize: "clamp(18px, 3vw, 26px)", fontWeight: 500, color: "var(--brown)", textAlign: "center", lineHeight: 1.4, marginBottom: 32 }}>
              {view.currentQuestion.prompt}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 24 }}>
              {view.currentQuestion.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSelected(opt)}
                  style={{
                    padding: "18px 16px",
                    fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 500,
                    textAlign: "center", lineHeight: 1.4, cursor: "pointer",
                    border: selected === opt ? "1px solid var(--gold)" : "1px solid var(--gold-line)",
                    background: selected === opt ? "rgba(214,168,79,0.12)" : "var(--cream)",
                    color: "var(--brown)",
                  }}
                >{opt}</button>
              ))}
            </div>
            <button onClick={handleAnswer} disabled={!selected} className="btn-gold" style={{ width: "100%", fontSize: 13, padding: "16px 0", opacity: !selected ? 0.4 : 1 }}>
              Lock In Answer
            </button>
          </>
        )}

        {answered && !roundResult && (
          <div style={{ textAlign: "center" }}>
            <div className="font-devanagari" style={{ fontSize: 48, color: "var(--gold)", lineHeight: 1, marginBottom: 16, animation: "glow-pulse 2s ease-in-out infinite" }}>ॐ</div>
            <p className="font-manrope" style={{ fontSize: 14, color: "var(--brown-soft)" }}>
              Answer locked. Waiting for opponent…
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── UI bits ───────────────────────────────────────────────────────────────────

function ConnectionBadge({ connected, error, floating = false }: { connected: boolean; error: string | null; floating?: boolean }) {
  if (connected && !error) return null
  return (
    <div style={{
      position: floating ? "fixed" : "static",
      top: floating ? 68 : undefined, right: floating ? 12 : undefined, zIndex: 100,
      padding: "6px 12px", fontSize: 11, fontFamily: "'Manrope', sans-serif",
      background: error ? "rgba(201,138,125,0.14)" : "rgba(42,24,16,0.06)",
      color: error ? "#9b3535" : "var(--brown-soft)",
      border: `1px solid ${error ? "rgba(201,138,125,0.3)" : "var(--gold-line)"}`,
      marginBottom: floating ? 0 : 16, display: "inline-block",
    }}>
      {error ? `Realtime: ${error}` : "Connecting to realtime…"}
    </div>
  )
}

function ScoreChip({ label, score, me = false }: { label: string; score: number; me?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span className="font-manrope" style={{ fontSize: 11, color: "var(--brown-faint)", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {me ? "You" : label}
      </span>
      <span className="font-cinzel" style={{ fontSize: 14, fontWeight: 700, color: me ? "var(--gold)" : "var(--burgundy)" }}>{score}</span>
    </div>
  )
}

function ScoreCol({ label, score, total, highlight = false }: { label: string; score: number; total: number; highlight?: boolean }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div className="eyebrow" style={{ fontSize: 10, marginBottom: 4, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
      <div className="font-cinzel" style={{ fontSize: 44, fontWeight: 700, color: highlight ? "var(--gold)" : "var(--brown)", lineHeight: 1 }}>
        {score}<span style={{ fontSize: "0.55em", color: "var(--brown-soft)" }}>/{total}</span>
      </div>
    </div>
  )
}

function RoundReview({ r }: { r: BattleView["completedRounds"][number] }) {
  return (
    <div style={{
      border: `1px solid ${r.myCorrect ? "var(--gold-line)" : "rgba(201,138,125,0.35)"}`,
      background: r.myCorrect ? "transparent" : "rgba(201,138,125,0.04)",
      padding: "18px 22px", marginBottom: 12,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span className="eyebrow" style={{ fontSize: 9 }}>Round {r.index + 1}</span>
        <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: r.myCorrect ? "var(--gold)" : "var(--pink)" }}>
          {r.myCorrect ? "You correct" : "You wrong"}
        </span>
      </div>
      <p className="font-cinzel" style={{ fontSize: 14, fontWeight: 500, color: "var(--brown)", marginBottom: 10 }}>{r.prompt}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <Row label="Your answer" value={r.myAnswer || "—"} color={r.myCorrect ? "var(--brown)" : "var(--pink)"} />
        {!r.myCorrect && <Row label="Correct" value={r.correctAnswer} color="var(--gold)" />}
        <Row label="Opponent" value={r.opponentAnswered ? (r.opponentCorrect ? "✓ correct" : "✗ wrong") : "—"} color={r.opponentCorrect ? "var(--gold)" : "var(--brown-soft)"} />
      </div>
    </div>
  )
}

function Row({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
      <span className="font-manrope" style={{ fontSize: 11, color: "var(--brown-faint)", minWidth: 90 }}>{label}</span>
      <span className="font-manrope" style={{ fontSize: 13, fontWeight: 500, color }}>{value}</span>
    </div>
  )
}
