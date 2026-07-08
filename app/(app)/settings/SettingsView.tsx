"use client"

import { useActionState, useEffect, useState } from "react"
import { changeUsername, changePassword, type ActionResult } from "@/app/actions/settings"
import { logout } from "@/app/actions/auth"

const initialState: ActionResult = {}

interface Props {
  username: string
  email:    string
}

export function SettingsView({ username: initialUsername, email }: Props) {
  // Track username locally so the form updates optimistically after a successful change
  const [displayUsername, setDisplayUsername] = useState(initialUsername)

  const [usernameState, usernameAction, usernamePending] = useActionState(
    changeUsername,
    initialState,
  )

  const [passwordState, passwordAction, passwordPending] = useActionState(
    changePassword,
    initialState,
  )

  // Propagate new username into local display state after successful change
  useEffect(() => {
    if (usernameState.success && usernameState.newUsername) {
      setDisplayUsername(usernameState.newUsername)
    }
  }, [usernameState])

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "clamp(24px,4vw,56px) clamp(16px,4vw,48px)",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 48 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Account</div>
        <h1
          className="font-cinzel"
          style={{
            fontSize: "clamp(28px,5vw,40px)",
            fontWeight: 700,
            color: "var(--brown)",
            letterSpacing: "-0.01em",
          }}
        >
          Settings
        </h1>
      </div>

      {/* ── Account info (read-only) ── */}
      <Section label="Account Info" style={{ marginBottom: 40 }}>
        <ReadOnlyRow label="Username" value={displayUsername} />
        <ReadOnlyRow label="Email"    value={email} last />
      </Section>

      {/* ── Change username ── */}
      <Section label="Change Username" style={{ marginBottom: 40 }}>
        <div style={{ padding: "24px 28px" }}>
          <p
            className="font-manrope"
            style={{ fontSize: 13, color: "var(--brown-soft)", marginBottom: 20, lineHeight: 1.6 }}
          >
            Your username appears on the leaderboard, battle rooms, and your public profile.
            You can change it up to 3 times per hour.
          </p>

          <form action={usernameAction} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <FormField
              id="username"
              label="New username"
              name="username"
              type="text"
              autoComplete="username"
              defaultValue={displayUsername}
              maxLength={20}
            />

            {usernameState.error && <FieldError message={usernameState.error} />}
            {usernameState.success && (
              <p className="font-manrope" style={{ fontSize: 13, color: "var(--gold)" }}>
                Username updated to <strong>{usernameState.newUsername}</strong>.
              </p>
            )}

            <div>
              <button
                type="submit"
                disabled={usernamePending}
                className="btn-gold"
                style={{ fontSize: 12, padding: "13px 32px" }}
              >
                {usernamePending ? "Saving…" : "Save Username"}
              </button>
            </div>
          </form>
        </div>
      </Section>

      {/* ── Change password ── */}
      <Section label="Change Password" style={{ marginBottom: 40 }}>
        <div style={{ padding: "24px 28px" }}>
          <p
            className="font-manrope"
            style={{ fontSize: 13, color: "var(--brown-soft)", marginBottom: 20, lineHeight: 1.6 }}
          >
            You can change your password up to 3 times per 15 minutes.
            Your new password must be at least 8 characters with one uppercase letter and one number.
          </p>

          <form action={passwordAction} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <FormField
              id="currentPassword"
              label="Current password"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
            />
            <FormField
              id="newPassword"
              label="New password"
              name="newPassword"
              type="password"
              autoComplete="new-password"
            />
            <ConfirmPasswordField />

            {passwordState.error && <FieldError message={passwordState.error} />}
            {passwordState.success && (
              <p className="font-manrope" style={{ fontSize: 13, color: "var(--gold)" }}>
                Password updated successfully.
              </p>
            )}

            <div>
              <button
                type="submit"
                disabled={passwordPending}
                className="btn-gold"
                style={{ fontSize: 12, padding: "13px 32px" }}
              >
                {passwordPending ? "Saving…" : "Change Password"}
              </button>
            </div>
          </form>
        </div>
      </Section>

      {/* ── Danger zone: logout ── */}
      <Section label="Session">
        <div
          style={{
            padding: "24px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <p className="font-manrope" style={{ fontSize: 13, color: "var(--brown-soft)" }}>
            Sign out of your account on this device.
          </p>
          <form action={logout}>
            <button
              type="submit"
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--burgundy)",
                background: "transparent",
                border: "1px solid rgba(90,30,45,0.35)",
                padding: "11px 28px",
                cursor: "pointer",
              }}
            >
              Log Out
            </button>
          </form>
        </div>
      </Section>
    </div>
  )
}

// ── Client-side confirm password field ───────────────────────────────────────
// Validates client-side only; server ignores this field.
// The real guard is that the server re-hashes + saves only the newPassword field.

function ConfirmPasswordField() {
  const [value, setValue] = useState("")
  const [sibling, setSibling] = useState("")
  const [touched, setTouched] = useState(false)

  const mismatch = touched && value !== sibling

  // Read the sibling field's value when this field is focused so comparison is fresh
  function handleFocus() {
    const np = (document.getElementById("newPassword") as HTMLInputElement | null)?.value ?? ""
    setSibling(np)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label
        htmlFor="confirmPassword"
        className="eyebrow"
        style={{ fontSize: 9 }}
      >
        Confirm new password
      </label>
      <input
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        value={value}
        onFocus={handleFocus}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => setTouched(true)}
        style={inputStyle}
      />
      {mismatch && (
        <p className="font-manrope" style={{ fontSize: 12, color: "var(--pink)", margin: 0 }}>
          Passwords do not match.
        </p>
      )}
    </div>
  )
}

// ── UI helpers ────────────────────────────────────────────────────────────────

function Section({
  label,
  children,
  style,
}: {
  label:    string
  children: React.ReactNode
  style?:   React.CSSProperties
}) {
  return (
    <div style={style}>
      <div className="eyebrow" style={{ marginBottom: 12, fontSize: 10 }}>{label}</div>
      <div style={{ border: "1px solid var(--gold-line)" }}>{children}</div>
    </div>
  )
}

function ReadOnlyRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 24px",
        borderBottom: last ? "none" : "1px solid var(--gold-line)",
        gap: 16,
        flexWrap: "wrap",
        background: "var(--cream)",
      }}
    >
      <span className="eyebrow" style={{ fontSize: 9 }}>{label}</span>
      <span
        className="font-manrope"
        style={{ fontSize: 14, color: "var(--brown)", fontWeight: 500 }}
      >
        {value}
      </span>
    </div>
  )
}

function FormField({
  id,
  label,
  name,
  type,
  autoComplete,
  defaultValue,
  maxLength,
}: {
  id:            string
  label:         string
  name:          string
  type:          "text" | "password"
  autoComplete?: string
  defaultValue?: string
  maxLength?:    number
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label htmlFor={id} className="eyebrow" style={{ fontSize: 9 }}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        maxLength={maxLength}
        required
        style={inputStyle}
      />
    </div>
  )
}

function FieldError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="font-manrope"
      style={{ fontSize: 13, color: "var(--pink)", margin: 0 }}
    >
      {message}
    </p>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  border: "1px solid var(--gold-line)",
  background: "var(--cream)",
  fontFamily: "'Manrope', sans-serif",
  fontSize: 14,
  color: "var(--brown)",
  outline: "none",
  boxSizing: "border-box",
}
