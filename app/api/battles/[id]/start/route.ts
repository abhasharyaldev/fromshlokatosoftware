import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { pickBattleQuestions, TOTAL_ROUNDS, type BattleRound } from "@/lib/battle"
import { buildBattleView } from "@/lib/battle-view"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const { id } = await params

  const battle = await prisma.battle.findUnique({
    where: { id },
    select: { id: true, player1Id: true, player2Id: true, status: true },
  })

  if (!battle) {
    return NextResponse.json({ error: "Battle not found." }, { status: 404 })
  }

  // Only creator can start
  if (battle.player1Id !== session.id) {
    return NextResponse.json({ error: "Only the room creator can start." }, { status: 403 })
  }

  if (battle.status !== "waiting") {
    return NextResponse.json({ error: "Battle already started." }, { status: 409 })
  }

  if (!battle.player2Id) {
    return NextResponse.json({ error: "Waiting for opponent to join." }, { status: 409 })
  }

  const questionIds = await pickBattleQuestions()
  const initialRounds: BattleRound[] = questionIds.map((qid, i) => ({
    index:     i,
    questionId: qid,
    answers:   {},
  }))

  await prisma.battle.update({
    where: { id: battle.id },
    data: {
      status:    "active",
      questions: questionIds,
      rounds:    initialRounds as unknown as object,
    },
  })

  const view = await buildBattleView(battle.id, session.id)
  return NextResponse.json({ battle: view, totalRounds: TOTAL_ROUNDS })
}
