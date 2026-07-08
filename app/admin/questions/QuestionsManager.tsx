"use client"

import { useState, useTransition } from "react"

type LessonRef = { id: string; title: string; category: string; slug: string }

type Question = {
  id: string
  lessonId: string
  type: string
  prompt: string
  options: string[] | null
  correctAnswer: string
  explanation: string | null
  order: number
  lesson: { title: string; category: string }
}

type FormState = {
  lessonId: string
  type: string
  prompt: string
  options: string   // newline-separated for textarea
  correctAnswer: string
  explanation: string
  order: string
}

function emptyForm(defaultLessonId = ""): FormState {
  return {
    lessonId: defaultLessonId, type: "mcq",
    prompt: "", options: "", correctAnswer: "", explanation: "", order: "0",
  }
}

const QUESTION_TYPES = ["mcq", "transliterate", "fill_blank"]

export function QuestionsManager({
  initialLessons,
  initialQuestions,
}: {
  initialLessons: LessonRef[]
  initialQuestions: Question[]
}) {
  const [questions, setQuestions] = useState(initialQuestions)
  const [form, setForm] = useState<FormState>(emptyForm(initialLessons[0]?.id ?? ""))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterLesson, setFilterLesson] = useState<string>("all")
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function flash(msg: string) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  function handleField(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function startEdit(q: Question) {
    setEditingId(q.id)
    setForm({
      lessonId:      q.lessonId,
      type:          q.type,
      prompt:        q.prompt,
      options:       (q.options ?? []).join("\n"),
      correctAnswer: q.correctAnswer,
      explanation:   q.explanation ?? "",
      order:         String(q.order),
    })
    setError(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm(initialLessons[0]?.id ?? ""))
    setError(null)
  }

  function buildPayload() {
    const options = form.type === "mcq"
      ? form.options.split("\n").map((s) => s.trim()).filter(Boolean)
      : null

    return {
      lessonId:      form.lessonId,
      type:          form.type,
      prompt:        form.prompt.trim(),
      options,
      correctAnswer: form.correctAnswer.trim(),
      explanation:   form.explanation.trim() || null,
      order:         parseInt(form.order, 10) || 0,
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const payload = buildPayload()
    const isEdit  = editingId !== null

    startTransition(async () => {
      try {
        const res = await fetch(
          isEdit ? `/api/admin/questions/${editingId}` : "/api/admin/questions",
          {
            method:  isEdit ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            // On update, lessonId is not part of the body (adminQuestionUpdateSchema omits it)
            body: JSON.stringify(isEdit ? { ...payload, lessonId: undefined } : payload),
          },
        )
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? "Something went wrong.")
          return
        }

        const lesson = initialLessons.find((l) => l.id === (isEdit ? (questions.find(q => q.id === editingId)?.lessonId ?? form.lessonId) : form.lessonId))
        const full: Question = {
          ...data.question,
          lesson: { title: lesson?.title ?? "", category: lesson?.category ?? "" },
        }

        if (isEdit) {
          setQuestions((prev) => prev.map((q) => (q.id === editingId ? full : q)))
          flash("Question updated.")
        } else {
          setQuestions((prev) => [...prev, full])
          flash("Question created.")
        }
        cancelEdit()
      } catch {
        setError("Network error. Please try again.")
      }
    })
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this question? This cannot be undone.")) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/questions/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Delete failed.")
        return
      }
      setQuestions((prev) => prev.filter((q) => q.id !== id))
      flash("Question deleted.")
    } catch {
      setError("Network error.")
    } finally {
      setDeletingId(null)
    }
  }

  const isEditing = editingId !== null
  const visible = filterLesson === "all"
    ? questions
    : questions.filter((q) => q.lessonId === filterLesson)

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "monospace", fontSize: 10, color: "#6a5a40", letterSpacing: "0.1em", marginBottom: 8 }}>
          CONTENT MANAGEMENT
        </div>
        <h1 style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 400, color: "#e8dcc8", margin: 0 }}>
          Questions
        </h1>
      </div>

      {/* ── Create / Edit form ── */}
      <div className="admin-card" style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: "monospace", fontSize: 10, color: "#6a5a40", letterSpacing: "0.1em", marginBottom: 20 }}>
          {isEditing ? "EDIT QUESTION" : "CREATE QUESTION"}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 16 }}>
            {/* Lesson selector — only shown on create */}
            {!isEditing && (
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="admin-label">Lesson *</label>
                <select className="admin-select admin-input" value={form.lessonId} onChange={(e) => handleField("lessonId", e.target.value)} required>
                  {initialLessons.map((l) => (
                    <option key={l.id} value={l.id}>{l.category} — {l.title}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="admin-label">Type *</label>
              <select className="admin-select admin-input" value={form.type} onChange={(e) => handleField("type", e.target.value)}>
                {QUESTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="admin-label">Order</label>
              <input className="admin-input" type="number" min={0} value={form.order} onChange={(e) => handleField("order", e.target.value)} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="admin-label">Prompt *</label>
            <textarea
              className="admin-input"
              value={form.prompt}
              onChange={(e) => handleField("prompt", e.target.value)}
              required
              maxLength={500}
              rows={2}
              style={{ resize: "vertical" }}
              placeholder="Which letter is this? अ"
            />
          </div>

          {form.type === "mcq" && (
            <div style={{ marginBottom: 16 }}>
              <label className="admin-label">Options (one per line, at least 2) *</label>
              <textarea
                className="admin-input"
                value={form.options}
                onChange={(e) => handleField("options", e.target.value)}
                rows={4}
                style={{ resize: "vertical" }}
                placeholder={"a\naa\ni\nii"}
              />
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label className="admin-label">Correct Answer *</label>
              <input className="admin-input" value={form.correctAnswer} onChange={(e) => handleField("correctAnswer", e.target.value)} required maxLength={200} placeholder="a" />
            </div>
            <div>
              <label className="admin-label">Explanation</label>
              <input className="admin-input" value={form.explanation} onChange={(e) => handleField("explanation", e.target.value)} maxLength={600} placeholder="Optional — shown after submission" />
            </div>
          </div>

          {error && <div className="admin-error" style={{ marginBottom: 12 }}>{error}</div>}
          {successMsg && <div className="admin-success" style={{ marginBottom: 12 }}>{successMsg}</div>}

          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" className="admin-btn admin-btn-primary" disabled={isPending}>
              {isPending ? "Saving…" : isEditing ? "Update Question" : "Create Question"}
            </button>
            {isEditing && (
              <button type="button" className="admin-btn" onClick={cancelEdit}>Cancel</button>
            )}
          </div>
        </form>
      </div>

      {/* ── Filter + table ── */}
      <div className="admin-card">
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <div style={{ fontFamily: "monospace", fontSize: 10, color: "#6a5a40", letterSpacing: "0.1em" }}>
            QUESTIONS ({visible.length})
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "monospace", fontSize: 10, color: "#6a5a40" }}>Filter:</span>
            <select
              className="admin-select"
              style={{ fontSize: 11, padding: "4px 8px" }}
              value={filterLesson}
              onChange={(e) => setFilterLesson(e.target.value)}
            >
              <option value="all">All lessons</option>
              {initialLessons.map((l) => (
                <option key={l.id} value={l.id}>{l.category} — {l.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Lesson</th>
                <th>Type</th>
                <th>Prompt</th>
                <th>Correct Answer</th>
                <th>Ord</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr><td colSpan={6} style={{ color: "#6a5a40", textAlign: "center", padding: 24 }}>No questions.</td></tr>
              )}
              {visible.map((q) => (
                <tr key={q.id} style={{ opacity: deletingId === q.id ? 0.4 : 1 }}>
                  <td>
                    <div style={{ color: "#c8a564", fontSize: 11 }}>{q.lesson.title}</div>
                    <div style={{ color: "#6a5a40", fontSize: 10 }}>{q.lesson.category}</div>
                  </td>
                  <td><span className="admin-badge admin-badge-blue">{q.type}</span></td>
                  <td style={{ maxWidth: 260 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.prompt}</div>
                  </td>
                  <td style={{ color: "#60c090" }}>{q.correctAnswer}</td>
                  <td>{q.order}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="admin-btn" onClick={() => startEdit(q)} disabled={deletingId === q.id}>Edit</button>
                      <button className="admin-btn admin-btn-danger" onClick={() => handleDelete(q.id)} disabled={deletingId === q.id}>Delete</button>
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
