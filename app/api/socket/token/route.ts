import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { signSocketToken } from "@/lib/socket-token"
import { rateLimit, getIp } from "@/lib/rate-limit"

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  // Guard against runaway token requests (e.g. a client stuck in reconnect loop)
  const ip = getIp(req.headers)
  const { allowed } = await rateLimit(`socket-token:${session.id}:${ip}`, 30, 60 * 1000)
  if (!allowed) {
    return NextResponse.json({ error: "Too many token requests." }, { status: 429 })
  }

  const token = signSocketToken({ userId: session.id, username: session.username })

  return NextResponse.json({
    token,
    url: process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3002",
    expiresInSeconds: 60,
  })
}
