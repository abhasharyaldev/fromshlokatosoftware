import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const lessons = await prisma.lesson.findMany({
    orderBy: [{ category: "asc" }, { order: "asc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      difficulty: true,
      xpReward: true,
      _count: { select: { questions: true } },
    },
  })

  const data = lessons.map((l) => ({
    id: l.id,
    slug: l.slug,
    title: l.title,
    category: l.category,
    difficulty: l.difficulty,
    xpReward: l.xpReward,
    questionCount: l._count.questions,
  }))

  return NextResponse.json({ lessons: data })
}
