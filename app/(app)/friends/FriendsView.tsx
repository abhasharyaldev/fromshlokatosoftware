"use client"

import { useState, useCallback, useRef } from "react"
import Link from "next/link"

// ── Types ─────────────────────────────────────────────────────────────────────

interface PublicUser {
  id:        string
  username:  string
  level:     number
  xp:        number
  eloRating: number
}

interface IncomingRequest {
  requestId: string
  from:      PublicUser
  sentAt:    string
}

interface OutgoingRequest {
  requestId: string
  to:        PublicUser
  sentAt:    string
}

interface Props {
  myId:             string
  initialFriends:   PublicUser[]
  initialIncoming:  IncomingRequest[]
  initialOutgoing:  OutgoingRequest[]
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FriendsView({
  myId,
  initialFriends,
  initialIncoming,
  initialOutgoing,
}: Props) {
  const [friends,  setFriends]  = useState<PublicUser[]>(initialFriends)
  const [incoming, setIncoming] = useState<IncomingRequest[]>(initialIncoming)
  const [outgoing, setOutgoing] = useState<OutgoingRequest[]>(initialOutgoing)

  // Search state
  const [query,        setQuery]        = useState("")
  const [searchResults, setSearchResults] = useState<PublicUser[]>([])
  const [searching,    setSearching]    = useState(false)
  const [searchError,  setSearchError]  = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Per-user action loading states
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())

  const setLoading = (id: string, on: boolean) =>
    setLoadingIds((prev) => {
      const next = new Set(prev)
      on ? next.add(id) : next.delete(id)
      return next
    })

  // ── Search ──────────────────────────────────────────────────────────────────

  const handleSearch = useCallback((q: string) => {
    setQuery(q)
    setSearchError(null)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q.trim()) {
      setSearchResults([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res  = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        if (!res.ok) { setSearchError(data.error ?? "Search failed."); return }
        setSearchResults(data.users as PublicUser[])
      } catch {
        setSearchError("Search failed. Try again.")
      } finally {
        setSearching(false)
      }
    }, 300)
  }, [])

  // ── Send request ─────────────────────────────────────────────────────────────

  const sendRequest = async (targetUserId: string) => {
    setLoading(targetUserId, true)
    try {
      const res  = await fetch("/api/friends/request", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ targetUserId }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error ?? "Failed to send request."); return }

      // Add a stub outgoing entry so the UI updates immediately
      const target = searchResults.find((u) => u.id === targetUserId)
      if (target) {
        setOutgoing((prev) => [
          { requestId: data.requestId, to: target, sentAt: new Date().toISOString() },
          ...prev,
        ])
      }
    } finally {
      setLoading(targetUserId, false)
    }
  }

  // ── Accept ───────────────────────────────────────────────────────────────────

  const acceptRequest = async (requestId: string) => {
    setLoading(requestId, true)
    try {
      const res  = await fetch("/api/friends/accept", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ requestId }),
      })
      if (!res.ok) { const d = await res.json(); alert(d.error ?? "Failed."); return }

      const req = incoming.find((r) => r.requestId === requestId)
      setIncoming((prev) => prev.filter((r) => r.requestId !== requestId))
      if (req) setFriends((prev) => [req.from, ...prev])
    } finally {
      setLoading(requestId, false)
    }
  }

  // ── Decline / cancel ─────────────────────────────────────────────────────────

  const declineRequest = async (requestId: string, isOutgoing = false) => {
    setLoading(requestId, true)
    try {
      const res = await fetch("/api/friends/decline", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ requestId }),
      })
      if (!res.ok) { const d = await res.json(); alert(d.error ?? "Failed."); return }

      if (isOutgoing) {
        setOutgoing((prev) => prev.filter((r) => r.requestId !== requestId))
      } else {
        setIncoming((prev) => prev.filter((r) => r.requestId !== requestId))
      }
    } finally {
      setLoading(requestId, false)
    }
  }

  // ── Remove friend ─────────────────────────────────────────────────────────────

  const removeFriend = async (friendUserId: string) => {
    if (!confirm("Remove this friend?")) return
    setLoading(friendUserId, true)
    try {
      const res  = await fetch("/api/friends/remove", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ friendUserId }),
      })
      if (!res.ok) { const d = await res.json(); alert(d.error ?? "Failed."); return }
      setFriends((prev) => prev.filter((f) => f.id !== friendUserId))
    } finally {
      setLoading(friendUserId, false)
    }
  }

  // ── Derived: already-related user IDs ────────────────────────────────────────

  const friendIds   = new Set(friends.map((f) => f.id))
  const pendingIds  = new Set([
    ...outgoing.map((r) => r.to.id),
    ...incoming.map((r) => r.from.id),
  ])

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "clamp(24px,4vw,56px) clamp(16px,4vw,48px)" }}>

      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Community</div>
        <h1
          className="font-cinzel"
          style={{ fontSize: "clamp(28px,5vw,44px)", fontWeight: 700, color: "var(--brown)", letterSpacing: "-0.01em", lineHeight: 1.15 }}
        >
          Friends
        </h1>
      </div>

      {/* ── Search ── */}
      <div style={{ marginBottom: 48 }}>
        <div className="eyebrow" style={{ marginBottom: 16, fontSize: 10 }}>Find Sādhakas</div>
        <div style={{ position: "relative", maxWidth: 480 }}>
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by username…"
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "1px solid var(--gold-line)",
              background: "var(--cream)",
              fontFamily: "'Manrope', sans-serif",
              fontSize: 14,
              color: "var(--brown)",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {searching && (
            <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "var(--brown-faint)", fontFamily: "Manrope, sans-serif" }}>
              Searching…
            </span>
          )}
        </div>

        {searchError && (
          <p className="font-manrope" style={{ marginTop: 8, fontSize: 13, color: "var(--pink)" }}>
            {searchError}
          </p>
        )}

        {searchResults.length > 0 && query && (
          <div style={{ marginTop: 8, border: "1px solid var(--gold-line)", maxWidth: 480 }}>
            {searchResults.map((u) => {
              const isFriend  = friendIds.has(u.id)
              const isPending = pendingIds.has(u.id)
              const loading   = loadingIds.has(u.id)
              return (
                <div
                  key={u.id}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    gap: 12, padding: "12px 16px",
                    borderBottom: "1px solid var(--gold-line)",
                    background: "var(--cream)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar username={u.username} size={30} />
                    <div>
                      <Link href={`/profile/${u.username}`} style={{ fontFamily: "Manrope,sans-serif", fontSize: 14, fontWeight: 600, color: "var(--brown)", textDecoration: "none" }}>
                        {u.username}
                      </Link>
                      <p className="font-manrope" style={{ fontSize: 11, color: "var(--brown-faint)", margin: 0 }}>
                        Lvl {u.level} · {u.eloRating} ELO
                      </p>
                    </div>
                  </div>
                  {isFriend ? (
                    <span className="eyebrow" style={{ fontSize: 9, color: "var(--gold)" }}>Friends</span>
                  ) : isPending ? (
                    <span className="eyebrow" style={{ fontSize: 9, color: "var(--brown-faint)" }}>Pending</span>
                  ) : (
                    <button
                      onClick={() => sendRequest(u.id)}
                      disabled={loading}
                      className="btn-gold"
                      style={{ fontSize: 10, padding: "8px 18px" }}
                    >
                      {loading ? "Sending…" : "Add Friend"}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {!searching && query.length >= 1 && searchResults.length === 0 && !searchError && (
          <p className="font-manrope" style={{ marginTop: 12, fontSize: 13, color: "var(--brown-faint)" }}>
            No sādhakas found for "{query}".
          </p>
        )}
      </div>

      {/* ── Incoming requests ── */}
      {incoming.length > 0 && (
        <Section label={`Requests Received (${incoming.length})`} style={{ marginBottom: 40 }}>
          {incoming.map((r) => (
            <RequestRow
              key={r.requestId}
              user={r.from}
              sentAt={r.sentAt}
              loading={loadingIds.has(r.requestId)}
              actions={
                <>
                  <button
                    onClick={() => acceptRequest(r.requestId)}
                    disabled={loadingIds.has(r.requestId)}
                    className="btn-gold"
                    style={{ fontSize: 10, padding: "8px 18px" }}
                  >
                    {loadingIds.has(r.requestId) ? "…" : "Accept"}
                  </button>
                  <button
                    onClick={() => declineRequest(r.requestId)}
                    disabled={loadingIds.has(r.requestId)}
                    style={ghostBtn}
                  >
                    Decline
                  </button>
                </>
              }
            />
          ))}
        </Section>
      )}

      {/* ── Outgoing requests ── */}
      {outgoing.length > 0 && (
        <Section label={`Requests Sent (${outgoing.length})`} style={{ marginBottom: 40 }}>
          {outgoing.map((r) => (
            <RequestRow
              key={r.requestId}
              user={r.to}
              sentAt={r.sentAt}
              loading={loadingIds.has(r.requestId)}
              actions={
                <button
                  onClick={() => declineRequest(r.requestId, true)}
                  disabled={loadingIds.has(r.requestId)}
                  style={ghostBtn}
                >
                  {loadingIds.has(r.requestId) ? "…" : "Cancel"}
                </button>
              }
            />
          ))}
        </Section>
      )}

      {/* ── Friends list ── */}
      <Section label={`Friends (${friends.length})`}>
        {friends.length === 0 ? (
          <div style={{ padding: "32px 20px", textAlign: "center" }}>
            <p className="font-manrope" style={{ fontSize: 14, color: "var(--brown-soft)" }}>
              No friends yet. Search above to find sādhakas to connect with.
            </p>
          </div>
        ) : (
          friends.map((f) => (
            <div
              key={f.id}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 12, padding: "14px 20px",
                borderBottom: "1px solid var(--gold-line)",
                background: "var(--cream)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <Avatar username={f.username} size={36} />
                <div style={{ minWidth: 0 }}>
                  <Link
                    href={`/profile/${f.username}`}
                    style={{ fontFamily: "Manrope,sans-serif", fontSize: 14, fontWeight: 600, color: "var(--brown)", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {f.username}
                  </Link>
                  <p className="font-manrope" style={{ fontSize: 11, color: "var(--brown-faint)", margin: 0 }}>
                    Lvl {f.level} · {f.xp.toLocaleString()} Shakti · {f.eloRating} ELO
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <Link href={`/profile/${f.username}`} style={{ ...ghostBtn, textDecoration: "none", display: "inline-flex", alignItems: "center" }} className="font-manrope">
                  View
                </Link>
                <button
                  onClick={() => removeFriend(f.id)}
                  disabled={loadingIds.has(f.id)}
                  style={{ ...ghostBtn, color: "var(--pink)" }}
                >
                  {loadingIds.has(f.id) ? "…" : "Remove"}
                </button>
              </div>
            </div>
          ))
        )}
      </Section>

    </div>
  )
}

// ── UI helpers ────────────────────────────────────────────────────────────────

function Avatar({ username, size }: { username: string; size: number }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        background: "var(--burgundy)", color: "var(--cream)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Cinzel', serif", fontSize: size * 0.38, fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {username[0].toUpperCase()}
    </div>
  )
}

function Section({
  label,
  children,
  style,
}: {
  label: string
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div style={style}>
      <div className="eyebrow" style={{ marginBottom: 12, fontSize: 10 }}>{label}</div>
      <div style={{ border: "1px solid var(--gold-line)" }}>{children}</div>
    </div>
  )
}

function RequestRow({
  user,
  sentAt,
  actions,
}: {
  user:    PublicUser
  sentAt:  string
  loading: boolean
  actions: React.ReactNode
}) {
  const date = new Date(sentAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })
  return (
    <div
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12, padding: "14px 20px",
        borderBottom: "1px solid var(--gold-line)",
        background: "var(--cream)",
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Avatar username={user.username} size={36} />
        <div>
          <Link href={`/profile/${user.username}`} style={{ fontFamily: "Manrope,sans-serif", fontSize: 14, fontWeight: 600, color: "var(--brown)", textDecoration: "none" }}>
            {user.username}
          </Link>
          <p className="font-manrope" style={{ fontSize: 11, color: "var(--brown-faint)", margin: 0 }}>
            Lvl {user.level} · {user.eloRating} ELO · {date}
          </p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>{actions}</div>
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
  padding: "8px 16px",
  cursor: "pointer",
}
