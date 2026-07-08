import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { computeStreak } from "@/lib/streak"
import { checkAndGrantAchievements } from "@/lib/achievements"
import type { QuestionResult, SubmitResult } from "@/lib/types"

// ── Validation schema ─────────────────────────────────────────────────────────

const submitSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        answer: z.string().max(500),
      })
    )
    .min(1, "At least one answer is required."),
})

// ── Answer comparison ─────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s.trim().toLowerCase()
}

function isCorrect(userAnswer: string, correctAnswer: string): boolean {
  return normalize(userAnswer) === normalize(correctAnswer)
}

// ── Level formula ─────────────────────────────────────────────────────────────

function calcLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100))
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // 1. Auth — server always verifies the session, never trusts client claims
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const { slug } = await params

  // 2. Validate request body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const parsed = submitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid submission.", fields: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { answers } = parsed.data

  // 3. Load lesson + ALL questions including correctAnswer (server-only)
  const lesson = await prisma.lesson.findUnique({
    where: { slug },
    select: {
      id: true,
      xpReward: true,
      questions: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          prompt: true,
          correctAnswer: true,
          explanation: true,
        },
      },
    },
  })

  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found." }, { status: 404 })
  }

  // 4. Reject submissions that don't cover all questions
  const questionIds = new Set(lesson.questions.map((q) => q.id))
  const submittedIds = new Set(answers.map((a) => a.questionId))
  for (const id of questionIds) {
    if (!submittedIds.has(id)) {
      return NextResponse.json(
        { error: "Incomplete submission — all questions must be answered." },
        { status: 400 }
      )
    }
  }

  // 5. Grade — server calculates every score, ignores any client claim
  const answerMap = new Map(answers.map((a) => [a.questionId, a.answer]))

  const results: QuestionResult[] = lesson.questions.map((q) => {
    const userAnswer = answerMap.get(q.id) ?? ""
    const correct = isCorrect(userAnswer, q.correctAnswer)
    return {
      questionId: q.id,
      prompt: q.prompt,
      userAnswer,
      correct,
      correctAnswer: q.correctAnswer,   // revealed only after submission
      explanation: q.explanation ?? null,
    }
  })

  const correctCount = results.filter((r) => r.correct).length
  const score = Math.round((correctCount / lesson.questions.length) * 100)

  // 6. XP — award only on first completion, then update level
  const existing = await prisma.userProgress.findUnique({
    where: { userId_lessonId: { userId: session.id, lessonId: lesson.id } },
    select: { id: true },
  })

  const alreadyCompleted = existing !== null
  const xpEarned = alreadyCompleted
    ? 0
    : Math.round((score / 100) * lesson.xpReward)

  // 7. Persist — upsert progress, award XP, update streak, recalc level atomically
  await prisma.$transaction(async (tx) => {
    // Read the current user row inside the transaction so streak is calculated
    // from the DB-authoritative state, never from any client-supplied value.
    const dbUser = await tx.user.findUniqueOrThrow({
      where: { id: session.id },
      select: { streakDays: true, lastActiveAt: true },
    })

    const streak = computeStreak(dbUser.streakDays, dbUser.lastActiveAt, new Date())

    if (alreadyCompleted) {
      await tx.userProgress.update({
        where: { userId_lessonId: { userId: session.id, lessonId: lesson.id } },
        data: { score: { set: score }, completedAt: new Date() },
      })

      // Still update streak — completing a lesson (even a repeat) counts as activity
      await tx.user.update({
        where: { id: session.id },
        data: {
          streakDays:   streak.streakDays,
          lastActiveAt: streak.lastActiveAt,
        },
      })
    } else {
      await tx.userProgress.create({
        data: {
          userId: session.id,
          lessonId: lesson.id,
          score,
          xpEarned,
          completedAt: new Date(),
        },
      })

      if (xpEarned > 0) {
        const updated = await tx.user.update({
          where: { id: session.id },
          data: {
            xp: { increment: xpEarned },
            streakDays:   streak.streakDays,
            lastActiveAt: streak.lastActiveAt,
          },
          select: { xp: true },
        })
        const newLevel = calcLevel(updated.xp)
        await tx.user.update({
          where: { id: session.id },
          data: { level: newLevel },
        })
      } else {
        await tx.user.update({
          where: { id: session.id },
          data: {
            streakDays:   streak.streakDays,
            lastActiveAt: streak.lastActiveAt,
          },
        })
      }
    }
  })

  // Achievement check runs after the main transaction so it never blocks grading.
  // Server-only — client has no way to trigger or influence this.
  const newAchievements = await checkAndGrantAchievements(session.id, {
    trigger: "lesson_completed",
  })

  const response: SubmitResult = {
    score,
    xpEarned,
    alreadyCompleted,
    results,
    newAchievements,
  }

  return NextResponse.json(response)
}
