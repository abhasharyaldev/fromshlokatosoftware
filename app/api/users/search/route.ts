import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { userSearchSchema } from "@/lib/validations"
import { rateLimit, getIp } from "@/lib/rate-limit"

// GET /api/users/search?q=username
export async function GET(req: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const ip = getIp(req.headers)
  const { allowed } = await rateLimit(`user-search:${session.id}:${ip}`, 30, 60_000)
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 })
  }

  const { searchParams } = new URL(req.url)
  const parsed = userSearchSchema.safeParse({ q: searchParams.get("q") ?? "" })
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 },
    )
  }

  const { q } = parsed.data

  const users = await prisma.user.findMany({
    where: {
      username: { contains: q, mode: "insensitive" },
      id: { not: session.id },
    },
    select: { id: true, username: true, level: true, eloRating: true },
    orderBy: { username: "asc" },
    take: 10,
  })

  return NextResponse.json({ users })
}
