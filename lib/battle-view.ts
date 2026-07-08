import { prisma } from "./prisma"
import { parseRounds, TOTAL_ROUNDS, type BattleView, type BattleStatus } from "./battle"

// Build the sanitized client view of a battle from the DB row.
// This is the ONLY function that decides what the client sees.
//
// Guarantees:
//   • correctAnswer + explanation are only included for rounds THIS user has already answered
//   • opponent's exact answer text is never returned — only correctness after they submit
//   • only the current unanswered question is exposed (not future questions)
export async function buildBattleView(
  battleId: string,
  meUserId: string
): Promise<BattleView | null> {
  const battle = await prisma.battle.findUnique({
    where: { id: battleId },
    select: {
      id: true, roomCode: true, status: true, winnerId: true,
      player1Id: true, player2Id: true,
      questions: true, rounds: true,
      player1: { select: { id: true, username: true, eloRating: true } },
      player2: { select: { id: true, username: true, eloRating: true } },
    },
  })

  if (!battle) return null

  const isP1 = battle.player1Id === meUserId
  const isP2 = battle.player2Id === meUserId
  if (!isP1 && !isP2) return null

  const me  = isP1 ? battle.player1 : battle.player2!
  const opp = isP1 ? battle.player2 : battle.player1

  const rounds       = parseRounds(battle.rounds)
  const questionIds  = Array.isArray(battle.questions) ? (battle.questions as string[]) : []

  // Count MY answers across rounds → currentRoundIndex
  const myAnswered = rounds.filter((r) => r.answers[meUserId]).length

  // Load questions actually needed to render (already answered + current only)
  const neededQIds = [
    ...rounds.slice(0, myAnswered).map((r) => r.questionId),
    // Include the current unanswered question if the battle is active
    ...(battle.status === "active" && myAnswered < TOTAL_ROUNDS && rounds[myAnswered]
      ? [rounds[myAnswered].questionId]
      : []),
  ]

  const questions = neededQIds.length
    ? await prisma.question.findMany({
        where: { id: { in: neededQIds } },
        select: { id: true, prompt: true, options: true, correctAnswer: true, explanation: true },
      })
    : []

  const qMap = new Map(questions.map((q) => [q.id, q]))

  // Score = number of correct answers each side has recorded so far
  const myScore  = rounds.filter((r) => r.answers[meUserId]?.correct).length
  const oppScore = opp
    ? rounds.filter((r) => r.answers[opp.id]?.correct).length
    : 0

  // Completed rounds (from this user's POV)
  const completedRounds = rounds.slice(0, myAnswered).map((r) => {
    const q         = qMap.get(r.questionId)
    const mine      = r.answers[meUserId]
    const theirs    = opp ? r.answers[opp.id] : undefined
    return {
      index:            r.index,
      prompt:           q?.prompt ?? "",
      correctAnswer:    q?.correctAnswer ?? "",
      explanation:      q?.explanation ?? null,
      myAnswer:         mine?.answer ?? "",
      myCorrect:        mine?.correct ?? false,
      opponentAnswered: !!theirs,
      opponentCorrect:  theirs?.correct,
    }
  })

  // Current question (only if it's my turn to answer)
  let currentQuestion: BattleView["currentQuestion"]
  if (battle.status === "active" && myAnswered < TOTAL_ROUNDS && rounds[myAnswered]) {
    const q = qMap.get(rounds[myAnswered].questionId)
    if (q) {
      currentQuestion = {
        prompt:  q.prompt,
        options: Array.isArray(q.options) ? (q.options as string[]) : [],
      }
    }
  }

  // Outcome (only meaningful when finished)
  let outcome: BattleView["outcome"]
  if (battle.status === "finished") {
    if (!battle.winnerId) outcome = "draw"
    else if (battle.winnerId === meUserId) outcome = "win"
    else outcome = "loss"
  }

  const canStart =
    battle.status === "waiting" && battle.player1Id === meUserId && !!battle.player2Id

  const view: BattleView = {
    id:            battle.id,
    roomCode:      battle.roomCode,
    status:        battle.status as BattleStatus,
    totalRounds:   TOTAL_ROUNDS,
    me: {
      userId:    meUserId,
      username:  me.username,
      score:     myScore,
      // Only expose eloBefore/After after the battle is finished
      eloBefore: undefined,
      eloAfter:  battle.status === "finished" ? me.eloRating : undefined,
    },
    opponent: opp ? { username: opp.username, score: oppScore } : null,
    currentRoundIndex: myAnswered,
    hasAnswered:       myAnswered >= TOTAL_ROUNDS ? true : false,
    currentQuestion,
    completedRounds,
    isCreator: isP1,
    canStart,
    winnerId:  battle.winnerId,
    outcome,
  }

  return view
}
