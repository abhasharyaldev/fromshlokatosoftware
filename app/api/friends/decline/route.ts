import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { friendActionSchema } from "@/lib/validations"

// POST /api/friends/decline
// Body: { requestId: string }
// Also used to cancel an outgoing request (sender can decline their own pending request).
export async function POST(req: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = friendActionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 },
    )
  }

  const { requestId } = parsed.data

  const friendship = await prisma.friendship.findUnique({
    where:  { id: requestId },
    select: { id: true, userId: true, friendId: true, status: true },
  })

  if (!friendship || friendship.status !== "pending") {
    return NextResponse.json({ error: "Request not found." }, { status: 404 })
  }

  // Only the receiver can decline; only the sender can cancel their own request
  const isReceiver = friendship.friendId === session.id
  const isSender   = friendship.userId   === session.id
  if (!isReceiver && !isSender) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 })
  }

  await prisma.friendship.delete({ where: { id: requestId } })

  return NextResponse.json({ status: "declined" })
}
