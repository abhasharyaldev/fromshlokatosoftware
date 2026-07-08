import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { friendRequestSchema } from "@/lib/validations"
import { rateLimit, getIp } from "@/lib/rate-limit"

// POST /api/friends/request
// Body: { targetUserId: string }
export async function POST(req: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const ip = getIp(req.headers)
  const { allowed } = await rateLimit(`friend-req:${session.id}:${ip}`, 10, 60_000)
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  const parsed = friendRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 },
    )
  }

  const { targetUserId } = parsed.data

  if (targetUserId === session.id) {
    return NextResponse.json({ error: "You cannot send a friend request to yourself." }, { status: 400 })
  }

  // Verify target exists
  const target = await prisma.user.findUnique({
    where:  { id: targetUserId },
    select: { id: true },
  })
  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 })
  }

  // Check for any existing relationship in either direction
  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userId: session.id, friendId: targetUserId },
        { userId: targetUserId, friendId: session.id },
      ],
    },
    select: { id: true, status: true },
  })

  if (existing) {
    if (existing.status === "accepted") {
      return NextResponse.json({ error: "You are already friends." }, { status: 409 })
    }
    return NextResponse.json({ error: "A friend request already exists." }, { status: 409 })
  }

  const friendship = await prisma.friendship.create({
    data: {
      userId:   session.id,
      friendId: targetUserId,
      status:   "pending",
    },
    select: { id: true },
  })

  return NextResponse.json({ requestId: friendship.id }, { status: 201 })
}
