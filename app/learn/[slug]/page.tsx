import { notFound } from "next/navigation"
import { requireSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { LessonPlayer } from "./LessonPlayer"
import type { PublicLesson, PublicQuestion } from "@/lib/types"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const lesson = await prisma.lesson.findUnique({ where: { slug }, select: { title: true } })
  return { title: lesson ? `${lesson.title} — FSTS` : "Lesson" }
}

export default async function LessonPage({ params }: Props) {
  // All lessons require authentication — requireSession redirects to /login if missing
  const session = await requireSession()
  const { slug } = await params

  const raw = await prisma.lesson.findUnique({
    where: { slug },
    select: {
      id: true, slug: true, title: true,
      category: true, difficulty: true, xpReward: true,
      questions: {
        orderBy: { order: "asc" },
        select: {
          id: true, type: true, prompt: true, options: true, order: true,
          // correctAnswer and explanation are NOT selected here.
          // They are only read inside the submit API route on the server.
        },
      },
    },
  })

  if (!raw) notFound()

  // Shape into PublicLesson — type system enforces correctAnswer is absent
  const lesson: PublicLesson = {
    id:         raw.id,
    slug:       raw.slug,
    title:      raw.title,
    category:   raw.category,
    difficulty: raw.difficulty,
    xpReward:   raw.xpReward,
    questions:  raw.questions.map((q): PublicQuestion => ({
      id:      q.id,
      type:    q.type as PublicQuestion["type"],
      prompt:  q.prompt,
      options: Array.isArray(q.options) ? (q.options as string[]) : null,
      order:   q.order,
    })),
  }

  // session.id is used by LessonPlayer to associate the submission — never trust client
  void session

  return <LessonPlayer lesson={lesson} />
}
