"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import type { PublicLesson, SubmitResult } from "@/lib/types"

// ── Types ─────────────────────────────────────────────────────────────────────

interface CollectedAnswer {
  questionId: string
  answer: string
}

type Phase = "quiz" | "submitting" | "results"

// ── Main component ────────────────────────────────────────────────────────────

export function LessonPlayer({ lesson }: { lesson: PublicLesson }) {
  const [step, setStep]             = useState(0)
  const [answers, setAnswers]       = useState<CollectedAnswer[]>([])
  const [current, setCurrent]       = useState<string>("")
  const [phase, setPhase]           = useState<Phase>("quiz")
  const [result, setResult]         = useState<SubmitResult | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const inputRef                    = useRef<HTMLInputElement>(null)

  const question  = lesson.questions[step]
  const totalSteps = lesson.questions.length
  const progress  = (step / totalSteps) * 100
  const hasAnswer = current.trim().length > 0

  function recordAndAdvance() {
    const updated: CollectedAnswer[] = [
      ...answers.filter((a) => a.questionId !== question.id),
      { questionId: question.id, answer: current.trim() },
    ]
    setAnswers(updated)
    setCurrent("")

    if (step < totalSteps - 1) {
      setStep(step + 1)
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      submitAll(updated)
    }
  }

  async function submitAll(finalAnswers: CollectedAnswer[]) {
    setPhase("submitting")
    setSubmitError(null)

    try {
      const res = await fetch(`/api/lessons/${lesson.slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: finalAnswers }),
      })

      const data = await res.json()

      if (!res.ok) {
        setSubmitError(data.error ?? "Something went wrong. Please try again.")
        setPhase("quiz")
        return
      }

      setResult(data as SubmitResult)
      setPhase("results")
    } catch {
      setSubmitError("Network error. Check your connection and try again.")
      setPhase("quiz")
    }
  }

  // ── Results screen ──────────────────────────────────────────────────────────

  if (phase === "results" && result) {
    const { score, xpEarned, alreadyCompleted, results } = result
    const correctCount = results.filter((r) => r.correct).length

    return (
      <div style={{ minHeight: "100dvh", background: "var(--cream)" }}>
        {/* Minimal header */}
        <div style={{
          position: "sticky", top: 0, background: "var(--cream)",
          borderBottom: "1px solid var(--gold-line)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 24px", height: 56, zIndex: 50,
        }}>
          <Link href="/learn" className="font-manrope" style={{ fontSize: 12, color: "var(--brown-faint)", textDecoration: "none" }}>
            ← All lessons
          </Link>
          <span className="eyebrow" style={{ fontSize: 10 }}>{lesson.title}</span>
          <div style={{ width: 60 }} />
        </div>

        <div style={{ maxWidth: 640, margin: "0 auto", padding: "clamp(32px, 5vw, 64px) clamp(20px, 4vw, 40px)" }}>

          {/* Score hero */}
          <div style={{ textAlign: "center", marginBottom: 48, paddingBottom: 40, borderBottom: "1px solid var(--gold-line)" }}>
            <div className="font-devanagari" style={{ fontSize: 56, color: "var(--gold)", lineHeight: 1, marginBottom: 16 }}>ॐ</div>
            <h2 className="font-cinzel" style={{ fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 700, color: "var(--brown)", marginBottom: 8 }}>
              {score === 100 ? "Perfect." : score >= 70 ? "Well done." : "Keep practising."}
            </h2>

            {/* Score ring */}
            <div style={{ display: "flex", justifyContent: "center", gap: 32, marginBottom: 24 }}>
              <div>
                <div className="font-cinzel" style={{ fontSize: "clamp(40px, 6vw, 64px)", fontWeight: 700, color: "var(--brown)", lineHeight: 1 }}>
                  {correctCount}<span style={{ fontSize: "0.5em", color: "var(--brown-soft)" }}>/{totalSteps}</span>
                </div>
                <div className="eyebrow" style={{ fontSize: 10, marginTop: 4 }}>Correct</div>
              </div>
              <div style={{ width: 1, background: "var(--gold-line)" }} />
              <div>
                <div className="font-cinzel" style={{ fontSize: "clamp(40px, 6vw, 64px)", fontWeight: 700, lineHeight: 1, color: xpEarned > 0 ? "var(--gold)" : "var(--brown-faint)" }}>
                  {xpEarned > 0 ? `+${xpEarned}` : "—"}
                </div>
                <div className="eyebrow" style={{ fontSize: 10, marginTop: 4 }}>Shakti</div>
              </div>
            </div>

            {alreadyCompleted && (
              <p className="font-manrope" style={{ fontSize: 13, color: "var(--brown-soft)", fontStyle: "italic" }}>
                You have completed this lesson before — XP is awarded only on the first completion.
              </p>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 24 }}>
              <Link href="/learn" className="btn-gold" style={{ fontSize: 12, padding: "13px 32px" }}>Next Lesson</Link>
              <Link href="/dashboard" className="btn-ghost" style={{ fontSize: 12, padding: "13px 32px" }}>Dashboard</Link>
            </div>
          </div>

          {/* Per-question breakdown */}
          <div>
            <div className="eyebrow" style={{ marginBottom: 20, fontSize: 10 }}>Review</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {results.map((r, i) => (
                <div
                  key={r.questionId}
                  style={{
                    border: `1px solid ${r.correct ? "var(--gold-line)" : "rgba(201,138,125,0.35)"}`,
                    background: r.correct ? "transparent" : "rgba(201,138,125,0.04)",
                    padding: "20px 24px",
                  }}
                >
                  {/* Question number + result badge */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <span className="eyebrow" style={{ fontSize: 9, color: "var(--brown-faint)" }}>Q{i + 1}</span>
                    <span
                      style={{
                        fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 700,
                        letterSpacing: "0.12em", textTransform: "uppercase",
                        color: r.correct ? "var(--gold)" : "var(--pink)",
                      }}
                    >
                      {r.correct ? "Correct" : "Incorrect"}
                    </span>
                  </div>

                  {/* Prompt */}
                  <p className="font-cinzel" style={{ fontSize: 14, fontWeight: 500, color: "var(--brown)", marginBottom: 12, lineHeight: 1.4 }}>
                    {r.prompt}
                  </p>

                  {/* Answers */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: r.explanation ? 14 : 0 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                      <span className="font-manrope" style={{ fontSize: 11, color: "var(--brown-faint)", minWidth: 80 }}>Your answer</span>
                      <span
                        className="font-manrope"
                        style={{
                          fontSize: 13, fontWeight: 500,
                          color: r.correct ? "var(--brown)" : "var(--pink)",
                        }}
                      >
                        {r.userAnswer || <em style={{ opacity: 0.5 }}>no answer</em>}
                      </span>
                    </div>
                    {!r.correct && (
                      <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                        <span className="font-manrope" style={{ fontSize: 11, color: "var(--brown-faint)", minWidth: 80 }}>Correct</span>
                        <span className="font-manrope" style={{ fontSize: 13, fontWeight: 600, color: "var(--gold)" }}>
                          {r.correctAnswer}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Explanation — revealed only after submit */}
                  {r.explanation && (
                    <p
                      className="font-manrope"
                      style={{
                        fontSize: 13, color: "var(--brown-soft)", lineHeight: 1.6,
                        paddingTop: 14, borderTop: "1px solid var(--gold-line)",
                      }}
                    >
                      {r.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    )
  }

  // ── Submitting overlay ──────────────────────────────────────────────────────

  if (phase === "submitting") {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div className="font-devanagari" style={{ fontSize: 64, color: "var(--gold)", lineHeight: 1, marginBottom: 16, animation: "glow-pulse 2s ease-in-out infinite" }}>
            ॐ
          </div>
          <p className="eyebrow" style={{ color: "var(--brown-soft)" }}>Checking answers…</p>
        </div>
      </div>
    )
  }

  // ── Quiz screen ─────────────────────────────────────────────────────────────

  const isLast = step === totalSteps - 1

  return (
    <div style={{ minHeight: "100dvh", background: "var(--cream)", position: "relative" }}>
      {/* Progress bar */}
      <div className="lesson-progress">
        <div className="lesson-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Header */}
      <div style={{
        position: "fixed", top: 4, left: 0, right: 0, height: 52,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", background: "var(--cream)",
        borderBottom: "1px solid var(--gold-line)", zIndex: 90,
      }}>
        <Link href="/learn" className="font-manrope" style={{ fontSize: 12, color: "var(--brown-faint)", textDecoration: "none", letterSpacing: "0.06em" }}>
          ← Exit
        </Link>
        <span className="eyebrow" style={{ fontSize: 10 }}>{lesson.title}</span>
        <span className="font-manrope" style={{ fontSize: 12, color: "var(--brown-faint)" }}>
          {step + 1} / {totalSteps}
        </span>
      </div>

      {/* Submit error banner */}
      {submitError && (
        <div style={{
          position: "fixed", top: 56, left: 0, right: 0, zIndex: 80,
          background: "rgba(201,138,125,0.12)", borderBottom: "1px solid rgba(201,138,125,0.3)",
          padding: "10px 24px", textAlign: "center",
        }}>
          <p className="font-manrope" style={{ fontSize: 13, color: "#9b3535" }}>{submitError}</p>
        </div>
      )}

      {/* Question */}
      <div
        key={question.id}
        className="fade-in"
        style={{
          minHeight: "100dvh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "80px 24px 48px", maxWidth: 640, margin: "0 auto",
        }}
      >
        {question.type === "mcq" && (
          <McqQuestion
            question={question}
            selected={current}
            onSelect={(v) => setCurrent(v)}
          />
        )}

        {(question.type === "fill_blank" || question.type === "transliterate") && (
          <TextQuestion
            question={question}
            value={current}
            onChange={setCurrent}
            inputRef={inputRef}
          />
        )}

        {/* Advance button */}
        <div style={{ marginTop: 40, width: "100%", maxWidth: 480 }}>
          <button
            onClick={recordAndAdvance}
            disabled={!hasAnswer}
            className="btn-gold"
            style={{
              width: "100%", fontSize: 13, padding: "18px 0",
              opacity: hasAnswer ? 1 : 0.35,
              cursor: hasAnswer ? "pointer" : "default",
            }}
          >
            {isLast ? "Submit" : "Continue"}
          </button>

          {/* Keyboard hint */}
          <p className="font-manrope" style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: "var(--brown-faint)" }}>
            Press Enter to continue
          </p>
        </div>
      </div>
    </div>
  )
}

// ── MCQ question ──────────────────────────────────────────────────────────────

function McqQuestion({
  question,
  selected,
  onSelect,
}: {
  question: PublicLesson["questions"][number]
  selected: string
  onSelect: (v: string) => void
}) {
  const options = (question.options as string[]) ?? []

  return (
    <div style={{ width: "100%", maxWidth: 540 }}>
      <div className="eyebrow" style={{ textAlign: "center", marginBottom: 32 }}>
        Choose the correct answer
      </div>
      <h2
        className="font-cinzel"
        style={{ fontSize: "clamp(18px, 3vw, 26px)", fontWeight: 500, color: "var(--brown)", textAlign: "center", lineHeight: 1.4, marginBottom: 40 }}
      >
        {question.prompt}
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        {options.map((opt) => {
          const isSelected = selected === opt
          return (
            <button
              key={opt}
              onClick={() => onSelect(opt)}
              style={{
                padding: "20px 16px",
                fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 500,
                textAlign: "center", lineHeight: 1.4, cursor: "pointer",
                border: isSelected ? "1px solid var(--gold)" : "1px solid var(--gold-line)",
                background: isSelected ? "rgba(214,168,79,0.12)" : "var(--cream)",
                color: "var(--brown)",
                transition: "background 120ms, border-color 120ms",
              }}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Text input question (fill_blank + transliterate) ──────────────────────────

function TextQuestion({
  question,
  value,
  onChange,
  inputRef,
}: {
  question: PublicLesson["questions"][number]
  value: string
  onChange: (v: string) => void
  inputRef: React.RefObject<HTMLInputElement | null>
}) {
  const isTransliterate = question.type === "transliterate"

  return (
    <div style={{ width: "100%", maxWidth: 540 }}>
      <div className="eyebrow" style={{ textAlign: "center", marginBottom: 32 }}>
        {isTransliterate ? "Type your answer" : "Fill in the blank"}
      </div>
      <h2
        className="font-cinzel"
        style={{ fontSize: "clamp(18px, 3vw, 26px)", fontWeight: 500, color: "var(--brown)", textAlign: "center", lineHeight: 1.4, marginBottom: 40 }}
      >
        {question.prompt}
      </h2>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim()) {
            // Bubble up to parent — handled via the Continue button's onClick
            // We just prevent form submit here; parent component reads the value
          }
        }}
        placeholder={isTransliterate ? "Type in Devanāgarī or IAST…" : "Your answer…"}
        autoFocus
        className="input-shloka"
        style={{ fontSize: 18, padding: "16px 20px", textAlign: "center" }}
      />
      {isTransliterate && (
        <p className="font-manrope" style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: "var(--brown-faint)" }}>
          Use Devanāgarī characters or IAST transliteration — both are accepted.
        </p>
      )}
    </div>
  )
}
