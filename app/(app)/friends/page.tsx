import { requireSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { FriendsView } from "./FriendsView"

const publicUser = {
  id: true,
  username: true,
  level: true,
  xp: true,
  eloRating: true,
} as const

export default async function FriendsPage() {
  const session = await requireSession()

  const [friendships, incoming, outgoing] = await Promise.all([
    prisma.friendship.findMany({
      where: {
        status: "accepted",
        OR: [{ userId: session.id }, { friendId: session.id }],
      },
      select: {
        userId: true,
        user:   { select: publicUser },
        friend: { select: publicUser },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.friendship.findMany({
      where:   { friendId: session.id, status: "pending" },
      select:  { id: true, createdAt: true, user: { select: publicUser } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.friendship.findMany({
      where:   { userId: session.id, status: "pending" },
      select:  { id: true, createdAt: true, friend: { select: publicUser } },
      orderBy: { createdAt: "desc" },
    }),
  ])

  const friends = friendships.map((f) =>
    f.userId === session.id ? f.friend : f.user,
  )

  return (
    <FriendsView
      myId={session.id}
      initialFriends={friends}
      initialIncoming={incoming.map((r) => ({
        requestId: r.id,
        from:      r.user,
        sentAt:    r.createdAt.toISOString(),
      }))}
      initialOutgoing={outgoing.map((r) => ({
        requestId: r.id,
        to:        r.friend,
        sentAt:    r.createdAt.toISOString(),
      }))}
    />
  )
}
