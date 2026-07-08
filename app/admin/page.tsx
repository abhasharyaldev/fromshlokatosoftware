import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export default async function AdminPage() {
  const [session, lessonCount, questionCount, userCount] = await Promise.all([
    getSession(),
    prisma.lesson.count(),
    prisma.question.count(),
    prisma.user.count(),
  ])

  const categoryCounts = await prisma.lesson.groupBy({
    by: ["category"],
    _count: { id: true },
    orderBy: { category: "asc" },
  })

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: "monospace", fontSize: 10, color: "#6a5a40", letterSpacing: "0.1em", marginBottom: 8 }}>
          OVERVIEW
        </div>
        <h1 style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 400, color: "#e8dcc8", margin: 0 }}>
          Admin Dashboard
        </h1>
        <p style={{ fontFamily: "monospace", fontSize: 11, color: "#6a5a40", marginTop: 6 }}>
          Signed in as {session?.username}
        </p>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 1, marginBottom: 40, background: "rgba(200,165,100,0.1)" }}>
        {[
          { label: "Lessons",   value: lessonCount },
          { label: "Questions", value: questionCount },
          { label: "Users",     value: userCount },
          { label: "Categories", value: categoryCounts.length },
        ].map(({ label, value }) => (
          <div key={label} className="admin-card" style={{ padding: "20px 24px", background: "#161410" }}>
            <div style={{ fontFamily: "monospace", fontSize: 28, fontWeight: 300, color: "#c8a564" }}>
              {value}
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: "#6a5a40", marginTop: 4, letterSpacing: "0.08em" }}>
              {label.toUpperCase()}
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick links ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginBottom: 40 }}>
        {[
          {
            href: "/admin/lessons",
            title: "Manage Lessons",
            desc: "Create, edit, and delete lessons across all categories.",
          },
          {
            href: "/admin/questions",
            title: "Manage Questions",
            desc: "Add, edit, and delete questions. Filter by lesson or category.",
          },
        ].map(({ href, title, desc }) => (
          <Link
            key={href}
            href={href}
            className="admin-card"
            style={{ textDecoration: "none", display: "block" }}
          >
            <div style={{ fontFamily: "monospace", fontSize: 13, color: "#c8a564", marginBottom: 8 }}>
              {title} →
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 11, color: "#6a5a40", lineHeight: 1.6 }}>
              {desc}
            </div>
          </Link>
        ))}
      </div>

      {/* ── Category breakdown ── */}
      <div className="admin-card">
        <div style={{ fontFamily: "monospace", fontSize: 10, color: "#6a5a40", letterSpacing: "0.1em", marginBottom: 16 }}>
          LESSONS BY CATEGORY
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Lessons</th>
            </tr>
          </thead>
          <tbody>
            {categoryCounts.map((row) => (
              <tr key={row.category}>
                <td>{row.category}</td>
                <td>{row._count.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
