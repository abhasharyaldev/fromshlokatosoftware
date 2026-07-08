"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type Relation = "self" | "friends" | "pending_sent" | "pending_received" | "none"

interface Props {
  profileUserId: string
  relation:      Relation
  requestId:     string | null
}

export function ProfileActions({ profileUserId, relation: initialRelation, requestId: initialRequestId }: Props) {
  const router = useRouter()
  const [relation,   setRelation]   = useState<Relation>(initialRelation)
  const [requestId,  setRequestId]  = useState<string | null>(initialRequestId)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  async function post(url: string, body: Record<string, string>) {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(url, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Something went wrong."); return null }
      return data
    } catch {
      setError("Network error. Try again.")
      return null
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    const data = await post("/api/friends/request", { targetUserId: profileUserId })
    if (data) { setRelation("pending_sent"); setRequestId(data.requestId) }
  }

  const handleAccept = async () => {
    if (!requestId) return
    const data = await post("/api/friends/accept", { requestId })
    if (data) { setRelation("friends"); router.refresh() }
  }

  const handleDecline = async () => {
    if (!requestId) return
    const data = await post("/api/friends/decline", { requestId })
    if (data) { setRelation("none"); setRequestId(null) }
  }

  const handleRemove = async () => {
    if (!confirm("Remove this friend?")) return
    const data = await post("/api/friends/remove", { friendUserId: profileUserId })
    if (data) { setRelation("none"); setRequestId(null) }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
      {relation === "none" && (
        <button onClick={handleAdd} disabled={loading} className="btn-gold" style={{ fontSize: 11, padding: "12px 28px" }}>
          {loading ? "Sending…" : "Add Friend"}
        </button>
      )}

      {relation === "pending_sent" && (
        <>
          <span className="eyebrow" style={{ fontSize: 9, color: "var(--brown-faint)" }}>Request Sent</span>
          <button onClick={handleDecline} disabled={loading} style={ghostBtn}>
            {loading ? "…" : "Cancel Request"}
          </button>
        </>
      )}

      {relation === "pending_received" && (
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleAccept} disabled={loading} className="btn-gold" style={{ fontSize: 11, padding: "12px 24px" }}>
            {loading ? "…" : "Accept"}
          </button>
          <button onClick={handleDecline} disabled={loading} style={ghostBtn}>
            {loading ? "…" : "Decline"}
          </button>
        </div>
      )}

      {relation === "friends" && (
        <>
          <span className="eyebrow" style={{ fontSize: 9, color: "var(--gold)" }}>Friends</span>
          <button onClick={handleRemove} disabled={loading} style={{ ...ghostBtn, color: "var(--pink)" }}>
            {loading ? "…" : "Remove Friend"}
          </button>
        </>
      )}

      {error && (
        <p className="font-manrope" style={{ fontSize: 12, color: "var(--pink)", margin: 0 }}>
          {error}
        </p>
      )}
    </div>
  )
}

const ghostBtn: React.CSSProperties = {
  fontFamily: "'Manrope', sans-serif",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--brown-soft)",
  background: "transparent",
  border: "1px solid var(--gold-line)",
  padding: "10px 20px",
  cursor: "pointer",
}
