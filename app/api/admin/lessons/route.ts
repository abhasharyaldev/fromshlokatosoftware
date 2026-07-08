import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin, adminLog } from "@/lib/admin"
import { adminLessonSchema } from "@/lib/validations"

// GET /api/admin/lessons — list all lessons with question counts
export async function GET() {
  const { session, error } = await requireAdmin()
  if (error) return error

  const lessons = await prisma.lesson.findMany({
    orderBy: [{ category: "asc" }, { order: "asc" }],
    select: {
      id: true, slug: true, title: true,
      category: true, difficulty: true, xpReward: true, order: true,
      createdAt: true, updatedAt: true,
      _count: { select: { questions: true } },
    },
  })

  adminLog("lessons.list", session.id, { count: lessons.length })
  return NextResponse.json({ lessons })
}

// POST /api/admin/lessons — create a lesson (no questions — add via /api/admin/questions)
export async function POST(req: NextRequest) {
  const { session, error } = await requireAdmin()
  if (error) return error

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

  // Slug uniqueness
  const existing = await prisma.lesson.findUnique({
    where: { slug: parsed.data.slug },
    select: { id: true },
  })
  if (existing) {
    return NextResponse.json({ error: "A lesson with that slug already exists." }, { status: 409 })
  }

  const lesson = await prisma.lesson.create({ data: parsed.data })
  adminLog("lessons.create", session.id, { lessonId: lesson.id, slug: lesson.slug })

  return NextResponse.json({ lesson }, { status: 201 })
}
