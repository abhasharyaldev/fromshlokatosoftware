"use client"

import Link from "next/link"
import { useActionState } from "react"
import { login } from "@/app/actions/auth"

export default function Login() {
  const [state, action, pending] = useActionState(login, null)

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ background: "var(--cream)" }}
    >
      <Link
        href="/"
        className="font-cinzel"
        style={{
          fontSize: 13,
          color: "var(--brown-soft)",
          textDecoration: "none",
          letterSpacing: "0.06em",
          marginBottom: 48,
          display: "block",
          textAlign: "center",
        }}
      >
        ← From Shloka to Software
      </Link>

      <div style={{ maxWidth: 440, width: "100%" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 40, height: 1, background: "var(--gold-line)" }} />
            <div className="diamond" />
            <div style={{ width: 40, height: 1, background: "var(--gold-line)" }} />
          </div>
          <h1
            className="font-cinzel"
            style={{ fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 500, color: "var(--brown)", letterSpacing: "0.03em", marginBottom: 8 }}
          >
            Welcome Back
          </h1>
          <p className="font-manrope" style={{ fontSize: 15, color: "var(--brown-soft)" }}>
            The tradition continues where you left it.
          </p>
        </div>

        {/* Error */}
        {state?.error && (
          <p className="font-manrope" style={{ color: "#b91c1c", fontSize: 14, textAlign: "center", marginBottom: 8 }}>
            {state.error}
          </p>
        )}

        {/* Form */}
        <form
          action={action}
          style={{ display: "flex", flexDirection: "column", gap: 20 }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label
              className="eyebrow"
              htmlFor="email"
              style={{ fontSize: 10, color: "var(--brown-soft)" }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="you@example.com"
              className="input-shloka"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label
              className="eyebrow"
              htmlFor="password"
              style={{ fontSize: 10, color: "var(--brown-soft)" }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              placeholder="••••••••"
              className="input-shloka"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="btn-gold"
            style={{ fontSize: 13, padding: "18px 0", marginTop: 8, width: "100%", opacity: pending ? 0.6 : 1 }}
          >
            {pending ? "Signing in…" : "Continue"}
          </button>
        </form>

        <p
          className="font-manrope"
          style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "var(--brown-faint)" }}
        >
          New to the tradition?{" "}
          <Link href="/signup" style={{ color: "var(--gold)", textDecoration: "none" }}>
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
