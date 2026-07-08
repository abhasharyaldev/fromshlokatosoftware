import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { parseRounds, normalize, updateElo, TOTAL_ROUNDS } from "@/lib/battle"
import { buildBattleView } from "@/lib/battle-view"
import { rateLimit, getIp } from "@/lib/rate-limit"

const answerSchema = z.object({
  roundIndex: z.number().int().min(0).max(TOTAL_ROUNDS - 1),
  answer:     z.string().min(1).max(500),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  // 20 answer submissions per minute per user — generous for 5-round battles,
  // tight enough to prevent transaction-flooding abuse.
  const { allowed } = await rateLimit(`battle-answer:${session.id}:${getIp(req.headers)}`, 20, 60_000)
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 })
  }

  const { id } = await params

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const parsed = answerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid answer payload." }, { status: 400 })
  }

  const { roundIndex, answer } = parsed.data

  // Wrap in transaction to serialize concurrent answer writes on the same battle
  const outcome = await prisma.$transaction(async (tx) => {
    const battle = await tx.battle.findUnique({
      where: { id },
      select: {
        id: true, status: true, winnerId: true,
        player1Id: true, player2Id: true,
        rounds: true, questions: true,
      },
    })

    if (!battle) return { kind: "not_found" as const }

    // Auth: must be a player
    if (battle.player1Id !== session.id && battle.player2Id !== session.id) {
      return { kind: "not_found" as const } // same 404 for privacy
    }

    if (battle.status !== "active") {
      return { kind: "bad_state" as const, error: "Battle is not active." }
    }

    const rounds = parseRounds(battle.rounds)
    const round  = rounds[roundIndex]
    if (!round) return { kind: "bad_state" as const, error: "Round does not exist." }

    // Enforce ordered play: user must answer their current round, not skip ahead
    const myAnswered = rounds.filter((r) => r.answers[session.id]).length
    if (roundIndex !== myAnswered) {
      return { kind: "bad_state" as const, error: "It is not this round yet." }
    }

    if (round.answers[session.id]) {
      return { kind: "bad_state" as const, error: "You have already answered this round." }
    }

    // Grade — server looks up the correct answer, never trusts client
    const question = await tx.question.findUnique({
      where: { id: round.questionId },
      select: { correctAnswer: true },
    })
    if (!question) return { kind: "bad_state" as const, error: "Question missing." }

    const isCorrect = normalize(answer) === normalize(question.correctAnswer)

    round.answers[session.id] = {
      answer,
      correct:     isCorrect,
      submittedAt: new Date().toISOString(),
    }

    // Persist the updated rounds — do this even if battle not finished yet
    await tx.battle.update({
      where: { id: battle.id },
      data:  { rounds: rounds as unknown as object },
    })

    // Check if the battle is now finished — both players answered ALL rounds
    const bothIds = [battle.player1Id, battle.player2Id].filter(Boolean) as string[]
    const bothFinishedAll =
      bothIds.length === 2 &&
      rounds.every((r) => bothIds.every((uid) => r.answers[uid]))

    if (!bothFinishedAll) {
      return { kind: "answered" as const }
    }

    // Finalize: compute scores, winner, and ELOs
    const [p1Id, p2Id] = bothIds
    const p1Score = rounds.filter((r) => r.answers[p1Id]?.correct).length
    const p2Score = rounds.filter((r) => r.answers[p2Id]?.correct).length

    let winnerId: string | null = null
    let p1Result: 0 | 0.5 | 1
    let p2Result: 0 | 0.5 | 1
    if (p1Score > p2Score)      { winnerId = p1Id; p1Result = 1;   p2Result = 0   }
    else if (p2Score > p1Score) { winnerId = p2Id; p1Result = 0;   p2Result = 1   }
    else                        {                  p1Result = 0.5; p2Result = 0.5 }

    const [p1, p2] = await Promise.all([
      tx.user.findUniqueOrThrow({ where: { id: p1Id }, select: { eloRating: true } }),
      tx.user.findUniqueOrThrow({ where: { id: p2Id }, select: { eloRating: true } }),
    ])

    const p1NewElo = updateElo(p1.eloRating, p2.eloRating, p1Result)
    const p2NewElo = updateElo(p2.eloRating, p1.eloRating, p2Result)

    await Promise.all([
      tx.user.update({ where: { id: p1Id }, data: { eloRating: p1NewElo } }),
      tx.user.update({ where: { id: p2Id }, data: { eloRating: p2NewElo } }),
    ])

    await tx.battle.update({
      where: { id: battle.id },
      data: {
        status:  "finished",
        winnerId,
      },
    })

    return { kind: "finished" as const }
  }, {
    isolationLevel: "Serializable",
  })

  if (outcome.kind === "not_found") {
    return NextResponse.json({ error: "Battle not found." }, { status: 404 })
  }
  if (outcome.kind === "bad_state") {
    return NextResponse.json({ error: outcome.error }, { status: 409 })
  }

  const view = await buildBattleView(id, session.id)
  return NextResponse.json({ battle: view })
}
