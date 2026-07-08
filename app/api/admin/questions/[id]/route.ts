import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin, adminLog } from "@/lib/admin"
import { adminQuestionUpdateSchema } from "@/lib/validations"

type Params = { params: Promise<{ id: string }> }

// PUT /api/admin/questions/[id] — update a question
export async function PUT(req: NextRequest, { params }: Params) {
  const { session, error } = await requireAdmin()
  if (error) return error

  const { id } = await params

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 })
  }

  const parsed = adminQuestionUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", fields: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const existing = await prisma.question.findUnique({ where: { id }, select: { id: true } })
  if (!existing) return NextResponse.json({ error: "Question not found." }, { status: 404 })

  const question = await prisma.question.update({
    where: { id },
    data: {
      type:          parsed.data.type,
      prompt:        parsed.data.prompt,
      options:       parsed.data.options ?? undefined,
      correctAnswer: parsed.data.correctAnswer,
      explanation:   parsed.data.explanation ?? undefined,
      order:         parsed.data.order ?? 0,
    },
  })

  adminLog("questions.update", session.id, { questionId: id })
  return NextResponse.json({ question })
}

// DELETE /api/admin/questions/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { session, error } = await requireAdmin()
  if (error) return error

  const { id } = await params

  const existing = await prisma.question.findUnique({
    where: { id },
    select: { id: true, lessonId: true },
  })
  if (!existing) return NextResponse.json({ error: "Question not found." }, { status: 404 })

  await prisma.question.delete({ where: { id } })
  adminLog("questions.delete", session.id, { questionId: id, lessonId: existing.lessonId })

  return NextResponse.json({ ok: true })
}
