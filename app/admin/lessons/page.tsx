import { prisma } from "@/lib/prisma"
import { LessonsManager } from "./LessonsManager"

export default async function AdminLessonsPage() {
  const lessons = await prisma.lesson.findMany({
    orderBy: [{ category: "asc" }, { order: "asc" }],
    select: {
      id: true, slug: true, title: true,
      category: true, difficulty: true, xpReward: true, order: true,
      updatedAt: true,
      _count: { select: { questions: true } },
    },
  })

  return <LessonsManager initialLessons={lessons} />
}
