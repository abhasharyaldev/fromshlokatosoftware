import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { leaveQueue } from "@/lib/matchmaking"

// POST /api/matchmaking/leave
// Removes the user from the queue. Safe to call even if not queued.
export async function POST() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  await leaveQueue(session.id)

  return NextResponse.json({ status: "left" })
}
