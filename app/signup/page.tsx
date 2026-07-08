"use client"

import Link from "next/link"
import { useActionState, useState } from "react"
import { register } from "@/app/actions/auth"

const MOTIVATIONS = [
  { id: "heritage",  label: "My heritage",        sub: "I want to connect with my roots and ancestors." },
  { id: "curiosity", label: "Pure curiosity",      sub: "The oldest language on Earth. How could I not?" },
  { id: "academic",  label: "Academic study",      sub: "Literature, philosophy, linguistics." },
  { id: "challenge", label: "A personal challenge", sub: "To know if I can. To prove that I can." },
]

export default function SignUp() {
  const [state, action, pending] = useActionState(register, null)
  const [phase, setPhase] = useState<"form" | "motivation">("form")
  const [fields, setFields] = useState({ username: "", email: "", password: "" })
  const [selected, setSelected] = useState<string | null>(null)

  function handleForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setFields({
      username: fd.get("username") as string,
      email:    fd.get("email")    as string,
      password: fd.get("password") as string,
    })
    setPhase("motivation")
  }

  if (phase === "motivation") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16" style={{ background: "var(--cream)" }}>
        <div className="fade-in" style={{ maxWidth: 560, width: "100%" }}>
          <div style={{ borderTop: "1px solid var(--gold-line)", paddingTop: 48, marginBottom: 40, textAlign: "center" }}>
            <div className="eyebrow" style={{ marginBottom: 16 }}>One last thing</div>
            <h2 className="font-cinzel" style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 500, color: "var(--brown)", letterSpacing: "0.02em" }}>
              What has brought you here?
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 40 }}>
            {MOTIVATIONS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelected(m.id)}
                style={{
                  display: "flex", flexDirection: "column", gap: 4,
                  textAlign: "left", padding: "20px 24px",
                  border: selected === m.id ? "1px solid var(--gold)" : "1px solid var(--gold-line)",
                  background: selected === m.id ? "rgba(214,168,79,0.08)" : "transparent",
                  cursor: "pointer", transition: "all 150ms",
                }}
              >
                <span className="font-cinzel" style={{ fontSize: 16, fontWeight: 500, color: selected === m.id ? "var(--gold)" : "var(--brown)" }}>
                  {m.label}
                </span>
                <span className="font-manrope" style={{ fontSize: 14, color: "var(--brown-soft)" }}>
                  {m.sub}
                </span>
              </button>
            ))}
          </div>

          {state?.error && (
            <p className="font-manrope" style={{ color: "#b91c1c", fontSize: 14, textAlign: "center", marginBottom: 16 }}>
              {state.error}
            </p>
          )}

          {/* Hidden form — submits all collected fields together */}
          <form action={action}>
            <input type="hidden" name="username" value={fields.username} />
            <input type="hidden" name="email"    value={fields.email} />
            <input type="hidden" name="password" value={fields.password} />
            <button
              type="submit"
              disabled={!selected || pending}
              className="btn-gold"
              style={{
                width: "100%", fontSize: 13, padding: "18px 0",
                opacity: (!selected || pending) ? 0.45 : 1,
                cursor: (!selected || pending) ? "default" : "pointer",
              }}
            >
              {pending ? "Creating account…" : "Begin"}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16" style={{ background: "var(--cream)" }}>
      <Link href="/" className="font-cinzel" style={{ fontSize: 13, color: "var(--brown-soft)", textDecoration: "none", letterSpacing: "0.06em", marginBottom: 48, display: "block", textAlign: "center" }}>
        ← From Shloka to Software
      </Link>

      <div style={{ maxWidth: 440, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div className="font-devanagari" style={{ fontSize: 48, color: "var(--gold)", lineHeight: 1, marginBottom: 16 }}>ॐ</div>
          <h1 className="font-cinzel" style={{ fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 500, color: "var(--brown)", letterSpacing: "0.03em", marginBottom: 8 }}>
            Create Your Account
          </h1>
          <p className="font-manrope" style={{ fontSize: 15, color: "var(--brown-soft)" }}>
            Your journey into the oldest language on Earth begins here.
          </p>
        </div>

        <form onSubmit={handleForm} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label className="eyebrow" htmlFor="username" style={{ fontSize: 10, color: "var(--brown-soft)" }}>Username</label>
            <input
              id="username" name="username" type="text" required
              minLength={3} maxLength={20}
              pattern="[a-zA-Z0-9_]+"
              placeholder="your_name"
              className="input-shloka"
            />
            <p className="font-manrope" style={{ fontSize: 12, color: "var(--brown-faint)" }}>
              Letters, numbers, and underscores only.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label className="eyebrow" htmlFor="email" style={{ fontSize: 10, color: "var(--brown-soft)" }}>Email</label>
            <input id="email" name="email" type="email" required placeholder="you@example.com" className="input-shloka" />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label className="eyebrow" htmlFor="password" style={{ fontSize: 10, color: "var(--brown-soft)" }}>Password</label>
            <input id="password" name="password" type="password" required minLength={8} placeholder="••••••••" className="input-shloka" />
            <p className="font-manrope" style={{ fontSize: 12, color: "var(--brown-faint)" }}>
              Min 8 characters, one uppercase letter, one number.
            </p>
          </div>

          <button type="submit" className="btn-gold" style={{ fontSize: 13, padding: "18px 0", marginTop: 8, width: "100%" }}>
            Continue
          </button>
        </form>

        <p className="font-manrope" style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "var(--brown-faint)" }}>
          Already walking the path?{" "}
          <Link href="/login" style={{ color: "var(--gold)", textDecoration: "none" }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
