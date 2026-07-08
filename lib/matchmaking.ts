import { redis } from "./redis"
import { prisma } from "./prisma"
import { pickBattleQuestions, generateUniqueRoomCode, type BattleRound } from "./battle"

// ── Constants ─────────────────────────────────────────────────────────────────

const QUEUE_KEY = "mm:queue"
const PLAYER_TTL_S = 300   // 5 min — max time a queue entry lives
const MATCH_TTL_S  = 120   // 2 min — matched entry lives long enough for client to poll

export const ELO_RANGE_INITIAL  = 200
export const ELO_RANGE_EXPANDED = 500
export const EXPAND_AFTER_MS    = 30_000   // switch to wider range after 30s
export const TIMEOUT_MS         = 120_000  // give up after 2 min

// ── Redis key helpers ─────────────────────────────────────────────────────────

function playerKey(userId: string) {
  return `mm:player:${userId}`
}

function matchKey(userId: string) {
  return `mm:match:${userId}`
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface QueueEntry {
  userId:    string
  username:  string
  eloRating: number
  joinedAt:  number   // ms epoch
}

interface MatchEntry {
  battleId: string
}

export type MatchmakingResult =
  | { status: "queued" }
  | { status: "already_in_queue" }

export type MatchmakingStatusResult =
  | { status: "not_in_queue" }
  | { status: "waiting";  waitMs: number; eloRange: number }
  | { status: "matched";  battleId: string }
  | { status: "timed_out" }

// ── Public API ────────────────────────────────────────────────────────────────

export async function joinQueue(
  userId:    string,
  username:  string,
  eloRating: number,
): Promise<MatchmakingResult> {
  // Idempotency: reject if already queued or already matched
  const [existingQueue, existingMatch] = await Promise.all([
    redis.get<QueueEntry>(playerKey(userId)),
    redis.get<MatchEntry>(matchKey(userId)),
  ])
  if (existingQueue || existingMatch) {
    return { status: "already_in_queue" }
  }

  const entry: QueueEntry = { userId, username, eloRating, joinedAt: Date.now() }

  await Promise.all([
    redis.zadd(QUEUE_KEY, { score: eloRating, member: userId }),
    redis.set(playerKey(userId), entry, { ex: PLAYER_TTL_S }),
  ])

  // Attempt immediate match with tight range
  await attemptMatch(userId, eloRating, ELO_RANGE_INITIAL)

  return { status: "queued" }
}

export async function leaveQueue(userId: string): Promise<void> {
  await Promise.all([
    redis.zrem(QUEUE_KEY, userId),
    redis.del(playerKey(userId)),
    redis.del(matchKey(userId)),
  ])
}

export async function getMatchmakingStatus(
  userId: string,
): Promise<MatchmakingStatusResult> {
  // Check for an existing match first (fastest path)
  const match = await redis.get<MatchEntry>(matchKey(userId))
  if (match) {
    return { status: "matched", battleId: match.battleId }
  }

  const entry = await redis.get<QueueEntry>(playerKey(userId))
  if (!entry) {
    return { status: "not_in_queue" }
  }

  const waitMs = Date.now() - entry.joinedAt

  // Timed out — clean up and inform client
  if (waitMs > TIMEOUT_MS) {
    await leaveQueue(userId)
    return { status: "timed_out" }
  }

  // Pick ELO range based on how long they've waited
  const eloRange = waitMs > EXPAND_AFTER_MS ? ELO_RANGE_EXPANDED : ELO_RANGE_INITIAL

  // Re-attempt matching on every status poll (cheap, avoids needing a background worker)
  const matched = await attemptMatch(userId, entry.eloRating, eloRange)
  if (matched) {
    const newMatch = await redis.get<MatchEntry>(matchKey(userId))
    if (newMatch) {
      return { status: "matched", battleId: newMatch.battleId }
    }
  }

  return { status: "waiting", waitMs, eloRange }
}

// ── Internal matching logic ───────────────────────────────────────────────────

// Tries to find and commit a match for userId in the given ELO range.
// Returns true if a battle was created and both players notified.
async function attemptMatch(
  userId:    string,
  eloRating: number,
  range:     number,
): Promise<boolean> {
  const min = eloRating - range
  const max = eloRating + range

  const candidates = await redis.zrange(QUEUE_KEY, min, max, { byScore: true })
  const opponents  = (candidates as string[]).filter((id) => id !== userId)
  if (opponents.length === 0) return false

  for (const opponentId of opponents) {
    // Verify opponent is still in queue (not already matched or timed out)
    const opponentEntry = await redis.get<QueueEntry>(playerKey(opponentId))
    if (!opponentEntry) continue

    // Guard against opponents who timed out but whose queue entry hasn't been cleaned yet
    const opponentWaitMs = Date.now() - opponentEntry.joinedAt
    if (opponentWaitMs > TIMEOUT_MS) {
      // Clean up stale entry opportunistically
      await leaveQueue(opponentId)
      continue
    }

    // Try to create the battle
    let battle: { id: string } | null = null
    try {
      battle = await createMatchedBattle(userId, opponentId)
    } catch {
      continue
    }
    if (!battle) continue

    const matchPayload = { battleId: battle.id }

    // Remove both from the sorted set and store their matched status.
    // Not fully atomic — acceptable for MVP scale.
    // In high-throughput production, replace with a Lua script.
    await Promise.all([
      redis.zrem(QUEUE_KEY, userId, opponentId),
      redis.del(playerKey(userId)),
      redis.del(playerKey(opponentId)),
      redis.set(matchKey(userId),     matchPayload, { ex: MATCH_TTL_S }),
      redis.set(matchKey(opponentId), matchPayload, { ex: MATCH_TTL_S }),
    ])

    return true
  }

  return false
}

// Creates a battle with both players already known. Status starts as "active"
// so both can jump straight into the battle room without a separate start step.
// Rounds are initialized from the question list so the socket server can
// immediately look them up via getDbRound() without seeing an empty array.
async function createMatchedBattle(
  player1Id: string,
  player2Id: string,
): Promise<{ id: string }> {
  const [roomCode, questions] = await Promise.all([
    generateUniqueRoomCode(),
    pickBattleQuestions(),
  ])

  const rounds: BattleRound[] = questions.map((questionId, index) => ({
    index,
    questionId,
    answers: {},
  }))

  return prisma.battle.create({
    data: {
      player1Id,
      player2Id,
      roomCode,
      status:    "active",
      questions,
      rounds:    rounds as unknown as object,
    },
    select: { id: true },
  })
}
