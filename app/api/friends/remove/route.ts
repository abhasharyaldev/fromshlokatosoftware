import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { friendRemoveSchema } from "@/lib/validations"

// POST /api/friends/remove
// Body: { friendUserId: string }
export async function POST(req: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = friendRemoveSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 },
    )
  }

  const { friendUserId } = parsed.data

  if (friendUserId === session.id) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }

  // The accepted friendship row may be stored in either direction
  const deleted = await prisma.friendship.deleteMany({
    where: {
      status: "accepted",
      OR: [
        { userId: session.id, friendId: friendUserId },
        { userId: friendUserId, friendId: session.id },
      ],
    },
  })

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Friendship not found." }, { status: 404 })
  }

  return NextResponse.json({ status: "removed" })
}
