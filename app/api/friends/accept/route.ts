import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { friendActionSchema } from "@/lib/validations"

// POST /api/friends/accept
// Body: { requestId: string }
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
    select: { id: true, friendId: true, status: true },
  })

  if (!friendship || friendship.status !== "pending") {
    return NextResponse.json({ error: "Request not found." }, { status: 404 })
  }

  // Only the intended recipient can accept
  if (friendship.friendId !== session.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 })
  }

  await prisma.friendship.update({
    where: { id: requestId },
    data:  { status: "accepted" },
  })

  return NextResponse.json({ status: "accepted" })
}
