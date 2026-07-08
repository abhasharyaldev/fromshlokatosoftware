import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin, adminLog } from "@/lib/admin"
import { adminQuestionSchema } from "@/lib/validations"

// POST /api/admin/questions — create a question attached to an existing lesson
export async function POST(req: NextRequest) {
  const { session, error } = await requireAdmin()
  if (error) return error

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 })
  }

  const parsed = adminQuestionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", fields: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  // Verify the lesson exists before attaching
  const lesson = await prisma.lesson.findUnique({
    where: { id: parsed.data.lessonId },
    select: { id: true },
  })
  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found." }, { status: 404 })
  }

  const question = await prisma.question.create({
    data: {
      lessonId:      parsed.data.lessonId,
      type:          parsed.data.type,
      prompt:        parsed.data.prompt,
      options:       parsed.data.options ?? undefined,
      correctAnswer: parsed.data.correctAnswer,
      explanation:   parsed.data.explanation ?? undefined,
      order:         parsed.data.order ?? 0,
    },
  })

  adminLog("questions.create", session.id, {
    questionId: question.id,
    lessonId:   parsed.data.lessonId,
  })

  return NextResponse.json({ question }, { status: 201 })
}
