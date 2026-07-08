import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

const joinSchema = z.object({
  roomCode: z
    .string()
    .trim()
    .transform((s) => s.toUpperCase())
    .pipe(z.string().regex(/^[A-Z0-9]{6}$/, "Room code must be 6 characters.")),
})

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const parsed = joinSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid room code." }, { status: 400 })
  }

  const { roomCode } = parsed.data

  const battle = await prisma.battle.findUnique({
    where: { roomCode },
    select: { id: true, player1Id: true, player2Id: true, status: true },
  })

  if (!battle) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 })
  }

  // Already in the room — return it so client can navigate
  if (battle.player1Id === session.id || battle.player2Id === session.id) {
    return NextResponse.json({ battle: { id: battle.id } })
  }

  if (battle.status !== "waiting") {
    return NextResponse.json({ error: "This battle has already started." }, { status: 409 })
  }

  if (battle.player2Id) {
    return NextResponse.json({ error: "This room is already full." }, { status: 409 })
  }

  // Atomic join: only assign player2 if still null
  const updated = await prisma.battle.updateMany({
    where: { id: battle.id, player2Id: null, status: "waiting" },
    data:  { player2Id: session.id },
  })

  if (updated.count === 0) {
    return NextResponse.json({ error: "This room is already full." }, { status: 409 })
  }

  return NextResponse.json({ battle: { id: battle.id } })
}
