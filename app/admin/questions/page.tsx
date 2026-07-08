import { prisma } from "@/lib/prisma"
import { QuestionsManager } from "./QuestionsManager"

export default async function AdminQuestionsPage() {
  const [lessons, questions] = await Promise.all([
    prisma.lesson.findMany({
      orderBy: [{ category: "asc" }, { order: "asc" }],
      select: { id: true, title: true, category: true, slug: true },
    }),
    prisma.question.findMany({
      orderBy: [{ lessonId: "asc" }, { order: "asc" }],
      include: { lesson: { select: { title: true, category: true } } },
    }),
  ])

  return <QuestionsManager initialLessons={lessons} initialQuestions={questions} />
}
