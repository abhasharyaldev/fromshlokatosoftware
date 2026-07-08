import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getMatchmakingStatus } from "@/lib/matchmaking"
import { rateLimit, getIp } from "@/lib/rate-limit"

// GET /api/matchmaking/status
// Returns the current matchmaking state for the authenticated user.
// Clients should poll this every 2–3 seconds while status is "waiting".
//
// Possible responses:
//   { status: "not_in_queue" }
//   { status: "waiting", waitMs: number, eloRange: number }
//   { status: "matched",  battleId: string }   ← navigate to /battle/:battleId
//   { status: "timed_out" }
export async function GET(req: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  // Allow frequent polling but cap at 60 req/min (one request every second)
  const ip = getIp(req.headers)
  const { allowed } = await rateLimit(`mm-status:${session.id}:${ip}`, 60, 60_000)
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 })
  }

  const result = await getMatchmakingStatus(session.id)
  return NextResponse.json(result)
}
