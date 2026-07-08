import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { generateUniqueRoomCode } from "@/lib/battle"

export async function POST() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const roomCode = await generateUniqueRoomCode()

  const battle = await prisma.battle.create({
    data: {
      player1Id: session.id,
      roomCode,
      status:    "waiting",
      questions: [],
      rounds:    [],
    },
    select: { id: true, roomCode: true },
  })

  return NextResponse.json({ battle }, { status: 201 })
}
