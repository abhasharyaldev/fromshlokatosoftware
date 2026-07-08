"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function BattleLanding({ eloRating }: { eloRating: number }) {
  const router = useRouter()
  const [mode, setMode] = useState<"idle" | "creating" | "joining">("idle")
  const [roomCode, setRoomCode] = useState("")
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    setMode("creating"); setError(null)
    try {
      const res = await fetch("/api/battles/create", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to create battle.")
      router.push(`/battle/${data.battle.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.")
      setMode("idle")
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!/^[A-Z0-9]{6}$/.test(roomCode.toUpperCase())) {
      setError("Room code must be 6 characters.")
      return
    }
    setMode("joining"); setError(null)
    try {
      const res = await fetch("/api/battles/join", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ roomCode: roomCode.toUpperCase() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to join battle.")
      router.push(`/battle/${data.battle.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.")
      setMode("idle")
    }
  }

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "clamp(24px,4vw,56px) clamp(16px,4vw,48px)" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Yuddha</div>
        <h1 className="font-cinzel" style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 700, color: "var(--brown)", letterSpacing: "-0.01em", lineHeight: 1.15 }}>
          Sanskrit Battle
        </h1>
        <p className="font-manrope" style={{ fontSize: 15, color: "var(--brown-soft)", marginTop: 8 }}>
          Five questions. Best score wins. ELO on the line.
        </p>
      </div>

      {/* Your rating */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32, padding: "12px 20px", border: "1px solid var(--gold-line)", alignSelf: "flex-start", width: "fit-content" }}>
        <span className="eyebrow" style={{ fontSize: 10 }}>Your rating</span>
        <span className="font-cinzel" style={{ fontSize: 22, fontWeight: 700, color: "var(--burgundy)" }}>{eloRating}</span>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: "rgba(201,138,125,0.12)", border: "1px solid rgba(201,138,125,0.3)", marginBottom: 24 }}>
          <p className="font-manrope" style={{ fontSize: 13, color: "#9b3535" }}>{error}</p>
        </div>
      )}

      {/* Two-column: Create + Join */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: 20 }}>

        {/* Create */}
        <div style={{ border: "1px solid var(--gold-line)", padding: "28px 32px" }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Create a room</div>
          <h3 className="font-cinzel" style={{ fontSize: 20, fontWeight: 500, color: "var(--brown)", marginBottom: 12 }}>
            Challenge a friend
          </h3>
          <p className="font-manrope" style={{ fontSize: 13, color: "var(--brown-soft)", marginBottom: 24, lineHeight: 1.6 }}>
            Generate a private room code. Share it with your opponent — they can join from this same page.
          </p>
          <button
            onClick={handleCreate}
            disabled={mode !== "idle"}
            className="btn-gold"
            style={{ width: "100%", fontSize: 12, padding: "15px 0", opacity: mode !== "idle" ? 0.6 : 1 }}
          >
            {mode === "creating" ? "Creating…" : "Create Room"}
          </button>
        </div>

        {/* Join */}
        <div style={{ border: "1px solid var(--gold-line)", padding: "28px 32px" }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Join a room</div>
          <h3 className="font-cinzel" style={{ fontSize: 20, fontWeight: 500, color: "var(--brown)", marginBottom: 12 }}>
            Have a room code?
          </h3>
          <p className="font-manrope" style={{ fontSize: 13, color: "var(--brown-soft)", marginBottom: 16, lineHeight: 1.6 }}>
            Enter the six-character code your opponent shared with you.
          </p>
          <form onSubmit={handleJoin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              className="input-shloka"
              style={{
                textTransform: "uppercase",
                letterSpacing: "0.4em",
                textAlign: "center",
                fontFamily: "'Cinzel', serif",
                fontSize: 20,
                fontWeight: 600,
              }}
            />
            <button
              type="submit"
              disabled={mode !== "idle" || roomCode.length !== 6}
              className="btn-ghost"
              style={{ fontSize: 12, padding: "15px 0", opacity: (mode !== "idle" || roomCode.length !== 6) ? 0.4 : 1 }}
            >
              {mode === "joining" ? "Joining…" : "Join Battle"}
            </button>
          </form>
        </div>
      </div>

      {/* Rules */}
      <div style={{ marginTop: 48, paddingTop: 32, borderTop: "1px solid var(--gold-line)" }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>How it works</div>
        <ul className="font-manrope" style={{ fontSize: 14, color: "var(--brown-soft)", lineHeight: 2, listStyle: "none", padding: 0 }}>
          <li>· Five multiple-choice questions per battle</li>
          <li>· Both players see the same questions</li>
          <li>· Most correct answers wins — ties count as a draw</li>
          <li>· Winner and loser ELOs update after the final question</li>
        </ul>
      </div>
    </div>
  )
}
