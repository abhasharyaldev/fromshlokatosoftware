import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin, adminLog } from "@/lib/admin"
import { adminLessonSchema } from "@/lib/validations"

type Params = { params: Promise<{ id: string }> }

// GET /api/admin/lessons/[id] — single lesson with all questions
export async function GET(_req: NextRequest, { params }: Params) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { order: "asc" } },
    },
  })

  if (!lesson) return NextResponse.json({ error: "Lesson not found." }, { status: 404 })
  return NextResponse.json({ lesson })
}

// PUT /api/admin/lessons/[id] — full update
export async function PUT(req: NextRequest, { params }: Params) {
  const { session, error } = await requireAdmin()
  if (error) return error

  const { id } = await params

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 })
  }

  const parsed = adminLessonSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", fields: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const existing = await prisma.lesson.findUnique({ where: { id }, select: { id: true, slug: true } })
  if (!existing) return NextResponse.json({ error: "Lesson not found." }, { status: 404 })

  // Slug uniqueness — allow keeping the same slug
  if (parsed.data.slug !== existing.slug) {
    const slugConflict = await prisma.lesson.findUnique({
      where: { slug: parsed.data.slug },
      select: { id: true },
    })
    if (slugConflict) {
      return NextResponse.json({ error: "A lesson with that slug already exists." }, { status: 409 })
    }
  }

  const lesson = await prisma.lesson.update({ where: { id }, data: parsed.data })
  adminLog("lessons.update", session.id, { lessonId: id, slug: lesson.slug })

  return NextResponse.json({ lesson })
}

// DELETE /api/admin/lessons/[id] — cascades to questions and user progress via schema
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { session, error } = await requireAdmin()
  if (error) return error

  const { id } = await params

  const existing = await prisma.lesson.findUnique({ where: { id }, select: { id: true, slug: true } })
  if (!existing) return NextResponse.json({ error: "Lesson not found." }, { status: 404 })

  await prisma.lesson.delete({ where: { id } })
  adminLog("lessons.delete", session.id, { lessonId: id, slug: existing.slug })

  return NextResponse.json({ ok: true })
}
