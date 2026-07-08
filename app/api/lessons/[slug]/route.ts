import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // All lessons require a valid session — guests are redirected to /login by
  // requireSession at the page layer. This API route returns 401 for unauthenticated
  // requests (e.g. direct API calls) rather than redirecting.
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const { slug } = await params

  const lesson = await prisma.lesson.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      difficulty: true,
      xpReward: true,
      questions: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          type: true,
          prompt: true,
          options: true,
          order: true,
          // correctAnswer and explanation are intentionally excluded.
          // They are only returned by the submit route after the user submits.
        },
      },
    },
  })

  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found." }, { status: 404 })
  }

  return NextResponse.json({ lesson })
}
