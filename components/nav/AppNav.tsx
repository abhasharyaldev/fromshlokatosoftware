"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { type ReactNode } from "react"
import { logout } from "@/app/actions/auth"
import type { SessionUser } from "@/lib/session"

const NAV_ITEMS = [
  { href: "/dashboard",   label: "Dashboard",   icon: HomeIcon },
  { href: "/learn",       label: "Learn",       icon: LearnIcon },
  { href: "/leaderboard", label: "Leaderboard", icon: CommunityIcon },
  { href: "/battle",      label: "Battle",      icon: BattleIcon },
]

const BOTTOM_ITEMS = [
  { href: "/profile",  label: "Profile",  icon: ProfileIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
]

const MOBILE_ITEMS = [
  { href: "/dashboard",   label: "Home",    icon: HomeIcon },
  { href: "/learn",       label: "Learn",   icon: LearnIcon },
  { href: "/battle",      label: "Battle",  icon: BattleIcon },
  { href: "/leaderboard", label: "Ranks",   icon: CommunityIcon },
]

interface Props {
  user: SessionUser
  children: ReactNode
}

export function AppNav({ user, children }: Props) {
  const path = usePathname()
  const xpToNextLevel = Math.pow(user.level, 2) * 100
  const xpPercent = Math.min(Math.round((user.xp / xpToNextLevel) * 100), 100)

  return (
    <>
      {/* ── Top Nav ── */}
      <nav className="top-nav">
        <Link
          href="/dashboard"
          className="font-cinzel"
          style={{ fontSize: 16, fontWeight: 700, color: "var(--gold)", textDecoration: "none", letterSpacing: "0.04em" }}
        >
          ॐ FSTS
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div className="level-badge" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="font-cinzel" style={{ fontSize: 10, opacity: 0.7 }}>LVL</span>
            <span style={{ fontSize: 14 }}>{user.level}</span>
          </div>

          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <XpArc percent={xpPercent} />
            <span style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", fontSize: 9, fontWeight: 600, color: "var(--gold)" }}>
              ⚡
            </span>
          </div>

          <form action={logout}>
            <button
              type="submit"
              title={`${user.username} — click to sign out`}
            style={{
                width: 36, height: 36,
                background: "var(--burgundy)",
                borderRadius: "50%",
                border: "none",
                cursor: "pointer",
                fontFamily: "'Cinzel', serif",
                fontSize: 14, fontWeight: 600,
                color: "var(--cream)",
              }}
            >
              {user.username[0].toUpperCase()}
            </button>
          </form>
        </div>
      </nav>

      {/* ── Sidebar (desktop) ── */}
      <aside className="app-sidebar">
        <div style={{ padding: "24px 20px", borderBottom: "1px solid var(--gold-line)", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 44, height: 44,
              background: "var(--burgundy)", borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Cinzel', serif", fontSize: 18, fontWeight: 600, color: "var(--cream)",
              flexShrink: 0,
            }}>
              {user.username[0].toUpperCase()}
            </div>
            <div>
              <div className="font-cinzel" style={{ fontSize: 14, fontWeight: 600, color: "var(--brown)" }}>
                {user.username}
              </div>
              <div className="eyebrow" style={{ fontSize: 10, marginTop: 2 }}>
                Level {user.level} · {user.streakDays}d streak
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span className="font-manrope" style={{ fontSize: 11, color: "var(--brown-soft)" }}>
              {user.xp.toLocaleString()} Shakti
            </span>
            <span className="font-manrope" style={{ fontSize: 11, color: "var(--brown-faint)" }}>
              {xpToNextLevel.toLocaleString()} next
            </span>
          </div>
          <div style={{ height: 3, background: "rgba(42,24,16,0.10)", borderRadius: 2 }}>
            <div style={{ height: "100%", width: `${xpPercent}%`, background: "var(--gold)", borderRadius: 2, transition: "width 600ms ease-out" }} />
          </div>
        </div>

        <nav style={{ padding: "8px 0" }}>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = path === href || (href !== "/dashboard" && path.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 20px", textDecoration: "none",
                  borderLeft: active ? "3px solid var(--gold)" : "3px solid transparent",
                  background: active ? "rgba(214,168,79,0.07)" : "transparent",
                  transition: "background 150ms",
                }}
              >
                <Icon active={active} />
                <span className="font-manrope" style={{ fontSize: 14, fontWeight: active ? 600 : 400, color: active ? "var(--brown)" : "var(--brown-soft)" }}>
                  {label}
                </span>
              </Link>
            )
          })}
        </nav>

        <div style={{ padding: "8px 0", borderTop: "1px solid var(--gold-line)", marginTop: 8 }}>
          {BOTTOM_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = path.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 20px", textDecoration: "none",
                  borderLeft: active ? "3px solid var(--gold)" : "3px solid transparent",
                  background: active ? "rgba(214,168,79,0.07)" : "transparent",
                }}
              >
                <Icon active={active} />
                <span className="font-manrope" style={{ fontSize: 14, fontWeight: active ? 600 : 400, color: active ? "var(--brown)" : "var(--brown-soft)" }}>
                  {label}
                </span>
              </Link>
            )
          })}

          <form action={logout}>
            <button
              type="submit"
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 20px", width: "100%",
                background: "transparent", border: "none",
                borderLeft: "3px solid transparent",
                cursor: "pointer", textAlign: "left",
              }}
            >
              <LogoutIcon />
              <span className="font-manrope" style={{ fontSize: 14, color: "var(--brown-soft)" }}>
                Logout
              </span>
            </button>
          </form>
        </div>
      </aside>

      <main className="app-main">{children}</main>

      {/* ── Bottom tab bar (mobile) ── */}
      <div className="bottom-nav">
        {MOBILE_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== "/dashboard" && path.startsWith(href))
          return (
            <Link key={href} href={href} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, textDecoration: "none", flex: 1, padding: "8px 0" }}>
              <Icon active={active} />
              <span className="font-manrope" style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: active ? "var(--gold)" : "var(--brown-faint)" }}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </>
  )
}

/* ── XP Arc SVG ── */

function XpArc({ percent }: { percent: number }) {
  const r = 13, cx = 16, cy = 16
  const toRad = (d: number) => (d * Math.PI) / 180
  const startDeg = 135
  const sx = cx + r * Math.cos(toRad(startDeg))
  const sy = cy + r * Math.sin(toRad(startDeg))
  const ex = cx + r * Math.cos(toRad(startDeg + 270))
  const ey = cy + r * Math.sin(toRad(startDeg + 270))
  const bgPath = `M ${sx.toFixed(1)} ${sy.toFixed(1)} A ${r} ${r} 0 1 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`
  const fillDeg = (Math.min(percent, 99.9) / 100) * 270
  const fdx = cx + r * Math.cos(toRad(startDeg + fillDeg))
  const fdy = cy + r * Math.sin(toRad(startDeg + fillDeg))
  const largeArc = fillDeg > 180 ? 1 : 0
  const fillPath = percent > 0 ? `M ${sx.toFixed(1)} ${sy.toFixed(1)} A ${r} ${r} 0 ${largeArc} 1 ${fdx.toFixed(1)} ${fdy.toFixed(1)}` : ""

  return (
    <svg width="32" height="32" viewBox="0 0 32 32">
      <path d={bgPath} fill="none" stroke="rgba(42,24,16,0.12)" strokeWidth="2.5" strokeLinecap="round" />
      {percent > 0 && <path d={fillPath} fill="none" stroke="var(--gold)" strokeWidth="2.5" strokeLinecap="round" />}
    </svg>
  )
}

/* ── Icons ── */

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M2 8L9 2L16 8V16H12V12H6V16H2V8Z" stroke={active ? "var(--gold)" : "var(--brown-soft)"} strokeWidth="1.5" strokeLinejoin="round" fill={active ? "rgba(214,168,79,0.15)" : "none"} />
    </svg>
  )
}

function LearnIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="3" width="14" height="12" rx="1" stroke={active ? "var(--gold)" : "var(--brown-soft)"} strokeWidth="1.5" fill={active ? "rgba(214,168,79,0.15)" : "none"} />
      <path d="M5 7H13M5 10H10" stroke={active ? "var(--gold)" : "var(--brown-soft)"} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function CommunityIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="6" r="3" stroke={active ? "var(--gold)" : "var(--brown-soft)"} strokeWidth="1.5" fill={active ? "rgba(214,168,79,0.15)" : "none"} />
      <path d="M3 15C3 12.239 5.686 10 9 10C12.314 10 15 12.239 15 15" stroke={active ? "var(--gold)" : "var(--brown-soft)"} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function BattleIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M3 15L11 7M11 7L14 4L15 5L12 8M11 7L13 9M6 12L9 15L15 15L15 12L12 12" stroke={active ? "var(--gold)" : "var(--brown-soft)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill={active ? "rgba(214,168,79,0.15)" : "none"} />
    </svg>
  )
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="6" r="3" stroke={active ? "var(--gold)" : "var(--brown-soft)"} strokeWidth="1.5" fill={active ? "rgba(214,168,79,0.15)" : "none"} />
      <path d="M3 16C3 12.686 5.686 10 9 10C12.314 10 15 12.686 15 16" stroke={active ? "var(--gold)" : "var(--brown-soft)"} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="2" stroke={active ? "var(--gold)" : "var(--brown-soft)"} strokeWidth="1.5" fill={active ? "rgba(214,168,79,0.15)" : "none"} />
      <path d="M9 1V3M9 15V17M17 9H15M3 9H1M14.7 3.3L13.2 4.8M4.8 13.2L3.3 14.7M14.7 14.7L13.2 13.2M4.8 4.8L3.3 3.3" stroke={active ? "var(--gold)" : "var(--brown-soft)"} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M7 3H3V15H7" stroke="var(--brown-faint)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 6L14 9L11 12" stroke="var(--brown-faint)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 9H14" stroke="var(--brown-faint)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
