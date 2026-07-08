import { redirect } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/session"

export const metadata = { title: "Admin — FSTS" }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side role check — this runs before any child page renders.
  // A regular user who guesses /admin gets redirected to /dashboard, not a 403 page,
  // so the existence of the admin area is not confirmed to them.
  const session = await getSession()
  if (!session || session.role !== "ADMIN") {
    redirect("/dashboard")
  }

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "#0f0e0c", color: "#e8dcc8" }}>
      {/* ── Top bar ── */}
      <header
        style={{
          display: "flex", alignItems: "center", gap: 24,
          padding: "0 32px", height: 52, flexShrink: 0,
          borderBottom: "1px solid rgba(200,165,100,0.15)",
          background: "#161410",
        }}
      >
        <span style={{ fontFamily: "monospace", fontSize: 11, color: "#c8a564", letterSpacing: "0.12em", fontWeight: 700 }}>
          FSTS ADMIN
        </span>
        <nav style={{ display: "flex", gap: 0, flex: 1 }}>
          {[
            { href: "/admin",           label: "Overview" },
            { href: "/admin/lessons",   label: "Lessons" },
            { href: "/admin/questions", label: "Questions" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{
                fontFamily: "monospace", fontSize: 11, color: "#a89070",
                textDecoration: "none", padding: "0 16px", height: 52,
                display: "flex", alignItems: "center",
                borderBottom: "2px solid transparent",
              }}
              className="admin-nav-link"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: "monospace", fontSize: 10, color: "#6a5a40" }}>
            {session.username}
          </span>
          <Link
            href="/dashboard"
            style={{
              fontFamily: "monospace", fontSize: 10, color: "#a89070",
              textDecoration: "none", padding: "5px 12px",
              border: "1px solid rgba(200,165,100,0.2)",
            }}
          >
            ← App
          </Link>
        </div>
      </header>

      {/* ── Page content ── */}
      <main style={{ flex: 1, padding: "32px", maxWidth: 1200, width: "100%", margin: "0 auto" }}>
        {children}
      </main>

      <style>{`
        .admin-nav-link:hover { color: #c8a564 !important; }
        .admin-table { width: 100%; border-collapse: collapse; font-family: monospace; font-size: 12px; }
        .admin-table th { text-align: left; padding: 8px 12px; color: #6a5a40; font-weight: 600; letter-spacing: 0.08em; font-size: 10px; text-transform: uppercase; border-bottom: 1px solid rgba(200,165,100,0.15); }
        .admin-table td { padding: 10px 12px; border-bottom: 1px solid rgba(200,165,100,0.08); color: #c8b890; vertical-align: top; }
        .admin-table tr:hover td { background: rgba(200,165,100,0.04); }
        .admin-btn { font-family: monospace; font-size: 11px; padding: 6px 14px; border: 1px solid rgba(200,165,100,0.3); background: transparent; color: #c8a564; cursor: pointer; letter-spacing: 0.04em; }
        .admin-btn:hover { background: rgba(200,165,100,0.1); }
        .admin-btn-danger { border-color: rgba(220,80,60,0.4); color: #e06050; }
        .admin-btn-danger:hover { background: rgba(220,80,60,0.1); }
        .admin-btn-primary { border-color: rgba(200,165,100,0.6); background: rgba(200,165,100,0.12); }
        .admin-input { font-family: monospace; font-size: 12px; background: #1a1714; border: 1px solid rgba(200,165,100,0.2); color: #e8dcc8; padding: 7px 10px; width: 100%; box-sizing: border-box; }
        .admin-input:focus { outline: none; border-color: rgba(200,165,100,0.5); }
        .admin-select { font-family: monospace; font-size: 12px; background: #1a1714; border: 1px solid rgba(200,165,100,0.2); color: #e8dcc8; padding: 7px 10px; }
        .admin-label { font-family: monospace; font-size: 10px; color: #6a5a40; text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-bottom: 4px; }
        .admin-error { font-family: monospace; font-size: 11px; color: #e06050; margin-top: 4px; }
        .admin-success { font-family: monospace; font-size: 11px; color: #60c090; margin-top: 4px; }
        .admin-card { background: #161410; border: 1px solid rgba(200,165,100,0.12); padding: 24px; }
        .admin-badge { font-family: monospace; font-size: 10px; padding: 2px 7px; border: 1px solid; display: inline-block; }
        .admin-badge-blue { color: #6090d0; border-color: rgba(96,144,208,0.3); }
        .admin-badge-green { color: #60c090; border-color: rgba(96,192,144,0.3); }
        .admin-badge-amber { color: #c8a564; border-color: rgba(200,165,100,0.3); }
      `}</style>
    </div>
  )
}
