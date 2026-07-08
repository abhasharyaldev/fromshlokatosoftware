import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

const publicUser = {
  id: true,
  username: true,
  level: true,
  xp: true,
  eloRating: true,
} as const

// GET /api/friends
// Returns friends list, incoming pending requests, outgoing pending requests.
// Never exposes email or passwordHash.
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const [friendships, incoming, outgoing] = await Promise.all([
    // Accepted friendships in either direction
    prisma.friendship.findMany({
      where: {
        status: "accepted",
        OR: [{ userId: session.id }, { friendId: session.id }],
      },
      select: {
        user:   { select: publicUser },
        friend: { select: publicUser },
        userId: true,
      },
      orderBy: { createdAt: "desc" },
    }),

    // Requests sent to me (I am the receiver)
    prisma.friendship.findMany({
      where: { friendId: session.id, status: "pending" },
      select: {
        id:        true,
        createdAt: true,
        user:      { select: publicUser },
      },
      orderBy: { createdAt: "desc" },
    }),

    // Requests I sent (I am the sender)
    prisma.friendship.findMany({
      where: { userId: session.id, status: "pending" },
      select: {
        id:        true,
        createdAt: true,
        friend:    { select: publicUser },
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  // Collapse bidirectional rows into a flat list of the other person
  const friends = friendships.map((f) =>
    f.userId === session.id ? f.friend : f.user,
  )

  return NextResponse.json({
    friends,
    incoming: incoming.map((r) => ({
      requestId: r.id,
      from:      r.user,
      sentAt:    r.createdAt,
    })),
    outgoing: outgoing.map((r) => ({
      requestId: r.id,
      to:        r.friend,
      sentAt:    r.createdAt,
    })),
  })
}
