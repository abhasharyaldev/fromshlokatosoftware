"use client"

import { useState, useTransition } from "react"

type Lesson = {
  id: string
  slug: string
  title: string
  category: string
  difficulty: string
  xpReward: number
  order: number
  updatedAt: Date | string
  _count: { questions: number }
}

type FormState = {
  slug: string
  title: string
  category: string
  difficulty: string
  xpReward: string
  order: string
}

const EMPTY: FormState = {
  slug: "", title: "", category: "alphabet",
  difficulty: "beginner", xpReward: "50", order: "0",
}

const CATEGORIES = ["alphabet", "transliteration", "vocabulary", "grammar", "shlokas"]
const DIFFICULTIES = ["beginner", "intermediate", "advanced"]

export function LessonsManager({ initialLessons }: { initialLessons: Lesson[] }) {
  const [lessons, setLessons] = useState(initialLessons)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function flash(msg: string) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  function startEdit(lesson: Lesson) {
    setEditingId(lesson.id)
    setForm({
      slug:       lesson.slug,
      title:      lesson.title,
      category:   lesson.category,
      difficulty: lesson.difficulty,
      xpReward:   String(lesson.xpReward),
      order:      String(lesson.order),
    })
    setError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(EMPTY)
    setError(null)
  }

  function handleField(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const payload = {
      slug:       form.slug.trim(),
      title:      form.title.trim(),
      category:   form.category,
      difficulty: form.difficulty,
      xpReward:   parseInt(form.xpReward, 10),
      order:      parseInt(form.order, 10),
    }

    startTransition(async () => {
      try {
        const isEdit = editingId !== null
        const res = await fetch(
          isEdit ? `/api/admin/lessons/${editingId}` : "/api/admin/lessons",
          {
            method:  isEdit ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(payload),
          },
        )
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? "Something went wrong.")
          return
        }
        const updated: Lesson = { ...data.lesson, _count: { questions: isEdit ? (lessons.find(l => l.id === editingId)?._count.questions ?? 0) : 0 } }
        if (isEdit) {
          setLessons((prev) => prev.map((l) => (l.id === editingId ? updated : l)))
          flash("Lesson updated.")
        } else {
          setLessons((prev) => [...prev, updated])
          flash("Lesson created.")
        }
        cancelEdit()
      } catch {
        setError("Network error. Please try again.")
      }
    })
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}" and all its questions? This cannot be undone.`)) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/lessons/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Delete failed.")
        return
      }
      setLessons((prev) => prev.filter((l) => l.id !== id))
      flash("Lesson deleted.")
    } catch {
      setError("Network error.")
    } finally {
      setDeletingId(null)
    }
  }

  const isEditing = editingId !== null

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "monospace", fontSize: 10, color: "#6a5a40", letterSpacing: "0.1em", marginBottom: 8 }}>
          CONTENT MANAGEMENT
        </div>
        <h1 style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 400, color: "#e8dcc8", margin: 0 }}>
          Lessons
        </h1>
      </div>

      {/* ── Create / Edit form ── */}
      <div className="admin-card" style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: "monospace", fontSize: 10, color: "#6a5a40", letterSpacing: "0.1em", marginBottom: 20 }}>
          {isEditing ? "EDIT LESSON" : "CREATE LESSON"}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 16 }}>
            <div>
              <label className="admin-label">Title *</label>
              <input className="admin-input" value={form.title} onChange={(e) => handleField("title", e.target.value)} required maxLength={120} placeholder="Devanagari Vowels" />
            </div>
            <div>
              <label className="admin-label">Slug *</label>
              <input className="admin-input" value={form.slug} onChange={(e) => handleField("slug", e.target.value)} required maxLength={80} placeholder="devanagari-vowels" pattern="[a-z0-9-]+" title="Lowercase letters, numbers, hyphens only" />
            </div>
            <div>
              <label className="admin-label">Category *</label>
              <select className="admin-select admin-input" value={form.category} onChange={(e) => handleField("category", e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="admin-label">Difficulty *</label>
              <select className="admin-select admin-input" value={form.difficulty} onChange={(e) => handleField("difficulty", e.target.value)}>
                {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="admin-label">XP Reward *</label>
              <input className="admin-input" type="number" min={1} max={500} value={form.xpReward} onChange={(e) => handleField("xpReward", e.target.value)} required />
            </div>
            <div>
              <label className="admin-label">Order</label>
              <input className="admin-input" type="number" min={0} value={form.order} onChange={(e) => handleField("order", e.target.value)} />
            </div>
          </div>

          {error && <div className="admin-error" style={{ marginBottom: 12 }}>{error}</div>}
          {successMsg && <div className="admin-success" style={{ marginBottom: 12 }}>{successMsg}</div>}

          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" className="admin-btn admin-btn-primary" disabled={isPending}>
              {isPending ? "Saving…" : isEditing ? "Update Lesson" : "Create Lesson"}
            </button>
            {isEditing && (
              <button type="button" className="admin-btn" onClick={cancelEdit}>Cancel</button>
            )}
          </div>
        </form>
      </div>

      {/* ── Lessons table ── */}
      <div className="admin-card">
        <div style={{ fontFamily: "monospace", fontSize: 10, color: "#6a5a40", letterSpacing: "0.1em", marginBottom: 16 }}>
          ALL LESSONS ({lessons.length})
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Slug</th>
                <th>Category</th>
                <th>Difficulty</th>
                <th>XP</th>
                <th>Order</th>
                <th>Questions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {lessons.length === 0 && (
                <tr><td colSpan={8} style={{ color: "#6a5a40", textAlign: "center", padding: 24 }}>No lessons yet.</td></tr>
              )}
              {lessons.map((lesson) => (
                <tr key={lesson.id} style={{ opacity: deletingId === lesson.id ? 0.4 : 1 }}>
                  <td style={{ color: "#e8dcc8" }}>{lesson.title}</td>
                  <td style={{ color: "#6a5a40" }}>{lesson.slug}</td>
                  <td>
                    <span className="admin-badge admin-badge-blue">{lesson.category}</span>
                  </td>
                  <td>
                    <span className={`admin-badge ${lesson.difficulty === "beginner" ? "admin-badge-green" : lesson.difficulty === "intermediate" ? "admin-badge-amber" : "admin-badge-blue"}`}>
                      {lesson.difficulty}
                    </span>
                  </td>
                  <td>{lesson.xpReward}</td>
                  <td>{lesson.order}</td>
                  <td>{lesson._count.questions}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="admin-btn" onClick={() => startEdit(lesson)} disabled={deletingId === lesson.id}>Edit</button>
                      <button className="admin-btn admin-btn-danger" onClick={() => handleDelete(lesson.id, lesson.title)} disabled={deletingId === lesson.id}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
