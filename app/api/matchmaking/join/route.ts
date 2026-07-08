import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { joinQueue } from "@/lib/matchmaking"
import { rateLimit, getIp } from "@/lib/rate-limit"

// POST /api/matchmaking/join
// Adds the authenticated user to the matchmaking queue.
// Immediately attempts a match; if found, battleId is returned on the next status poll.
export async function POST(req: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  // 5 joins per minute per user+IP — prevents queue-flooding abuse
  const ip = getIp(req.headers)
  const { allowed } = await rateLimit(`mm-join:${session.id}:${ip}`, 5, 60_000)
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 })
  }

  // Always fetch a fresh ELO from the DB.
  // The session cookie may hold a stale value; we must not let the client
  // influence their own matchmaking bracket by manipulating cached data.
  const user = await prisma.user.findUnique({
    where:  { id: session.id },
    select: { eloRating: true, username: true },
  })
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 })
  }

  const result = await joinQueue(session.id, user.username, user.eloRating)

  if (result.status === "already_in_queue") {
    return NextResponse.json(
      { error: "You are already in the matchmaking queue. Check /api/matchmaking/status." },
      { status: 409 },
    )
  }

  return NextResponse.json({ status: "queued" })
}
