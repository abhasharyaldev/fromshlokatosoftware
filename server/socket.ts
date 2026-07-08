/**
 * Standalone Socket.io server for real-time battles.
 *
 * Runs as a separate Node process (npm run dev:socket) alongside Next.js.
 * Communicates with the SAME Postgres database via the same Prisma client.
 *
 * Handshake auth: short-lived JWT issued by /api/socket/token (which itself
 * requires a valid session cookie). No JWT is ever stored in localStorage.
 *
 * The server owns:
 *   - Round timer (20s per round)
 *   - Answer correctness (verified against DB question row)
 *   - Score, winner, ELO
 *   - Round transitions and battle finalization
 *
 * The client only displays state. Every payload is Zod-validated. Answers
 * are rate-limited and de-duplicated per user per round.
 */

import "dotenv/config"
import { createServer } from "http"
import { Server, type Socket } from "socket.io"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { verifySocketToken } from "@/lib/socket-token"
import {
  parseRounds, normalize, updateElo, TOTAL_ROUNDS,
  type BattleRound,
} from "@/lib/battle"
import { buildBattleView } from "@/lib/battle-view"
import { checkAndGrantAchievements } from "@/lib/achievements"

// ── Config ────────────────────────────────────────────────────────────────────

const PORT           = Number(process.env.SOCKET_PORT ?? 3002)
const FRONTEND_URL   = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
const ROUND_MS       = 20_000
const DISCONNECT_GRACE_MS = 15_000

// ── In-memory battle state ────────────────────────────────────────────────────

interface BattleRuntime {
  battleId:        string
  playerIds:       [string, string]
  currentRound:    number      // 0..TOTAL_ROUNDS
  roundStartedAt:  number
  roundDeadline:   number
  roundTimer:      NodeJS.Timeout | null
  ready:           Set<string>
  connected:       Set<string>
  answered:        Set<string>   // userIds who submitted for current round
  disconnectTimers: Map<string, NodeJS.Timeout>
  status:          "waiting_ready" | "in_progress" | "finished"
}

const battles = new Map<string, BattleRuntime>()

// Per-socket, per-event rate limit (defense in depth on top of duplicate guards)
const eventRateLimit = new Map<string, { count: number; resetAt: number }>()

function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = eventRateLimit.get(key)
  if (!entry || now > entry.resetAt) {
    eventRateLimit.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= max) return false
  entry.count++
  return true
}

// ── Payload schemas ───────────────────────────────────────────────────────────

const joinPayload = z.object({
  battleId: z.string().min(1).max(64),
})

const answerPayload = z.object({
  roundIndex: z.number().int().min(0).max(TOTAL_ROUNDS - 1),
  answer:     z.string().min(1).max(500),
})

// ── HTTP + Socket.io ──────────────────────────────────────────────────────────

const http = createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" })
  res.end("FSTS socket server")
})

const io = new Server(http, {
  cors: {
    origin: FRONTEND_URL,
    credentials: true,
  },
})

// ── Auth middleware (handshake) ───────────────────────────────────────────────

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token
    if (typeof token !== "string" || token.length < 8) {
      return next(new Error("Missing auth token"))
    }
    const payload = verifySocketToken(token)
    socket.data.userId   = payload.userId
    socket.data.username = payload.username
    next()
  } catch {
    next(new Error("Invalid or expired token"))
  }
})

// ── Connection handling ──────────────────────────────────────────────────────

io.on("connection", (socket: Socket) => {
  const userId   = socket.data.userId as string
  const username = socket.data.username as string

  broadcastPresence()

  socket.on("battle:join", async (raw, ack?: (r: unknown) => void) => {
    const parsed = joinPayload.safeParse(raw)
    if (!parsed.success) return ack?.({ ok: false, error: "Invalid payload" })

    const { battleId } = parsed.data

    // Rate limit: max 10 join attempts per socket per minute
    if (!rateLimit(`join:${socket.id}`, 10, 60_000)) {
      return ack?.({ ok: false, error: "Too many join attempts" })
    }

    // Verify user is a player in this battle
    const battle = await prisma.battle.findUnique({
      where: { id: battleId },
      select: { id: true, status: true, player1Id: true, player2Id: true },
    })

    if (!battle) return ack?.({ ok: false, error: "Battle not found" })
    if (battle.player1Id !== userId && battle.player2Id !== userId) {
      return ack?.({ ok: false, error: "You are not a player in this battle" })
    }
    if (battle.status !== "active") {
      // Client should call the REST /start endpoint first; realtime kicks in from active onward.
      // For "waiting", just acknowledge — the room can be joined pre-start for presence.
    }

    // Track socket → user, join the room
    socket.join(roomOf(battleId))

    // Initialize (or retrieve) runtime state for this battle
    const runtime = ensureRuntime(battle.id, battle.player1Id, battle.player2Id)
    runtime.connected.add(userId)

    // Cancel any pending disconnect grace timer for this user
    const graceTimer = runtime.disconnectTimers.get(userId)
    if (graceTimer) {
      clearTimeout(graceTimer)
      runtime.disconnectTimers.delete(userId)
    }

    // Send them the current view immediately so they can render
    const view = await buildBattleView(battleId, userId)
    ack?.({ ok: true, view })
    broadcastPresence()
  })

  socket.on("battle:ready", async (raw, ack?: (r: unknown) => void) => {
    // ready payload just carries { battleId }
    const parsed = joinPayload.safeParse(raw)
    if (!parsed.success) return ack?.({ ok: false, error: "Invalid payload" })

    const runtime = battles.get(parsed.data.battleId)
    if (!runtime) return ack?.({ ok: false, error: "Battle not in memory" })
    if (!runtime.playerIds.includes(userId)) return ack?.({ ok: false, error: "Not a player" })

    if (!rateLimit(`ready:${socket.id}`, 5, 60_000)) {
      return ack?.({ ok: false, error: "Too many ready attempts" })
    }

    runtime.ready.add(userId)
    ack?.({ ok: true })

    // Both players ready → start first round
    if (
      runtime.status === "waiting_ready" &&
      runtime.ready.size === 2
    ) {
      // Battle must be status=active in DB before we start pushing rounds
      const dbBattle = await prisma.battle.findUnique({
        where: { id: runtime.battleId },
        select: { status: true },
      })
      if (dbBattle?.status === "active") {
        await startRound(runtime, 0)
        for (const pid of runtime.playerIds) {
          const view = await buildBattleView(runtime.battleId, pid)
          io.to(socketOfUser(pid) ?? "").emit("battle:started", {
            view,
            roundStartedAt: runtime.roundStartedAt,
            roundDeadline:  runtime.roundDeadline,
          })
        }
      }
    }
  })

  socket.on("battle:answer", async (raw, ack?: (r: unknown) => void) => {
    const parsed = answerPayload.safeParse(raw)
    if (!parsed.success) return ack?.({ ok: false, error: "Invalid payload" })

    // Rate limit: max 10 answer events per socket per 10s — a defense in depth
    // (duplicate submission is still blocked by the `answered` set below).
    if (!rateLimit(`answer:${socket.id}`, 10, 10_000)) {
      return ack?.({ ok: false, error: "Too many answer events" })
    }

    const { roundIndex, answer } = parsed.data
    const runtime = findRuntimeByPlayer(userId)
    if (!runtime) return ack?.({ ok: false, error: "No active battle" })

    if (runtime.status !== "in_progress") {
      return ack?.({ ok: false, error: "Battle not in progress" })
    }
    if (roundIndex !== runtime.currentRound) {
      return ack?.({ ok: false, error: "Wrong round" })
    }
    if (runtime.answered.has(userId)) {
      return ack?.({ ok: false, error: "Already answered this round" })
    }

    // Server-side receive time — never trust client-supplied response time
    const serverReceivedAt = Date.now()
    const responseTimeMs   = Math.max(0, serverReceivedAt - runtime.roundStartedAt)

    // Grade against DB
    const round = await getDbRound(runtime.battleId, roundIndex)
    if (!round) return ack?.({ ok: false, error: "Round missing" })

    const question = await prisma.question.findUnique({
      where:  { id: round.questionId },
      select: { correctAnswer: true },
    })
    if (!question) return ack?.({ ok: false, error: "Question missing" })

    const correct = normalize(answer) === normalize(question.correctAnswer)

    // Persist to battle.rounds JSON
    await recordAnswer(runtime.battleId, roundIndex, userId, answer, correct, serverReceivedAt)

    runtime.answered.add(userId)
    ack?.({ ok: true, responseTimeMs })

    // If both answered → advance immediately
    if (runtime.answered.size === 2) {
      if (runtime.roundTimer) clearTimeout(runtime.roundTimer)
      runtime.roundTimer = null
      await concludeRound(runtime, roundIndex)
    }
  })

  socket.on("disconnect", () => {
    const runtime = findRuntimeByPlayer(userId)
    broadcastPresence()

    if (!runtime) return

    runtime.connected.delete(userId)

    // Start a grace timer — if user doesn't reconnect within window, notify opponent
    const grace = setTimeout(() => {
      const still = battles.get(runtime.battleId)
      if (!still || still.connected.has(userId)) return
      io.to(roomOf(runtime.battleId)).emit("battle:opponent_left", { userId })
    }, DISCONNECT_GRACE_MS)

    runtime.disconnectTimers.set(userId, grace)
  })

  // ── helper: find which socket a user is connected on ───────────────────────
  function socketOfUser(uid: string): string | null {
    for (const [, s] of io.sockets.sockets) {
      if (s.data.userId === uid) return s.id
    }
    return null
  }
})

// ── Runtime helpers ───────────────────────────────────────────────────────────

function roomOf(battleId: string): string {
  return `battle:${battleId}`
}

function ensureRuntime(
  battleId:  string,
  p1Id:      string,
  p2Id:      string | null,
): BattleRuntime {
  let r = battles.get(battleId)
  if (r) return r
  r = {
    battleId,
    playerIds:       [p1Id, p2Id ?? ""] as [string, string],
    currentRound:    0,
    roundStartedAt:  0,
    roundDeadline:   0,
    roundTimer:      null,
    ready:           new Set(),
    connected:       new Set(),
    answered:        new Set(),
    disconnectTimers: new Map(),
    status:          "waiting_ready",
  }
  battles.set(battleId, r)
  return r
}

function findRuntimeByPlayer(userId: string): BattleRuntime | null {
  for (const r of battles.values()) {
    if (r.playerIds.includes(userId)) return r
  }
  return null
}

async function startRound(runtime: BattleRuntime, roundIndex: number): Promise<void> {
  runtime.status         = "in_progress"
  runtime.currentRound   = roundIndex
  runtime.roundStartedAt = Date.now()
  runtime.roundDeadline  = runtime.roundStartedAt + ROUND_MS
  runtime.answered.clear()

  runtime.roundTimer = setTimeout(async () => {
    // Time up — force-close any unanswered players as incorrect
    for (const uid of runtime.playerIds) {
      if (!uid) continue
      if (!runtime.answered.has(uid)) {
        // Record empty answer (grades as wrong)
        await recordAnswer(runtime.battleId, roundIndex, uid, "", false, Date.now())
      }
    }
    await concludeRound(runtime, roundIndex)
  }, ROUND_MS)
}

async function getDbRound(battleId: string, roundIndex: number): Promise<BattleRound | null> {
  const battle = await prisma.battle.findUnique({
    where: { id: battleId }, select: { rounds: true },
  })
  const rounds = parseRounds(battle?.rounds ?? [])
  return rounds[roundIndex] ?? null
}

async function recordAnswer(
  battleId:  string,
  roundIndex: number,
  userId:    string,
  answer:    string,
  correct:   boolean,
  submittedAtMs: number,
) {
  // Optimistic serializable update — read, mutate, write inside a tx
  await prisma.$transaction(async (tx) => {
    const b = await tx.battle.findUniqueOrThrow({
      where: { id: battleId }, select: { rounds: true },
    })
    const rounds = parseRounds(b.rounds)
    const round  = rounds[roundIndex]
    if (!round) return
    // No-op if already recorded (idempotent)
    if (round.answers[userId]) return
    round.answers[userId] = {
      answer,
      correct,
      submittedAt: new Date(submittedAtMs).toISOString(),
    }
    await tx.battle.update({
      where: { id: battleId },
      data:  { rounds: rounds as unknown as object },
    })
  }, { isolationLevel: "Serializable" })
}

async function concludeRound(runtime: BattleRuntime, roundIndex: number): Promise<void> {
  // Emit round_result to both players with correctness (correct answer revealed now)
  const round = await getDbRound(runtime.battleId, roundIndex)
  if (!round) return

  const question = await prisma.question.findUnique({
    where:  { id: round.questionId },
    select: { correctAnswer: true, explanation: true },
  })

  const results = runtime.playerIds
    .filter(Boolean)
    .map((uid) => ({ userId: uid, correct: !!round.answers[uid]?.correct }))

  io.to(roomOf(runtime.battleId)).emit("battle:round_result", {
    roundIndex,
    correctAnswer: question?.correctAnswer ?? "",
    explanation:   question?.explanation ?? null,
    players:       results,
  })

  const isLast = roundIndex >= TOTAL_ROUNDS - 1
  if (isLast) {
    await finalizeBattle(runtime)
    return
  }

  // Brief pause so players can absorb the round result, then advance.
  setTimeout(async () => {
    await startRound(runtime, roundIndex + 1)
    for (const uid of runtime.playerIds) {
      if (!uid) continue
      const view = await buildBattleView(runtime.battleId, uid)
      const s   = findSocketOfUser(uid)
      if (s) {
        io.to(s).emit("battle:next_round", {
          view,
          roundIndex:     runtime.currentRound,
          roundStartedAt: runtime.roundStartedAt,
          roundDeadline:  runtime.roundDeadline,
        })
      }
    }
  }, 3000)
}

function findSocketOfUser(uid: string): string | null {
  for (const [, s] of io.sockets.sockets) {
    if (s.data.userId === uid) return s.id
  }
  return null
}

async function finalizeBattle(runtime: BattleRuntime): Promise<void> {
  runtime.status = "finished"
  if (runtime.roundTimer) clearTimeout(runtime.roundTimer)

  const [p1Id, p2Id] = runtime.playerIds
  const battle = await prisma.battle.findUniqueOrThrow({
    where:  { id: runtime.battleId },
    select: { rounds: true },
  })
  const rounds = parseRounds(battle.rounds)
  const p1Score = rounds.filter((r) => r.answers[p1Id]?.correct).length
  const p2Score = rounds.filter((r) => r.answers[p2Id]?.correct).length

  let winnerId: string | null = null
  let p1Result: 0 | 0.5 | 1
  let p2Result: 0 | 0.5 | 1
  if (p1Score > p2Score)      { winnerId = p1Id; p1Result = 1;   p2Result = 0   }
  else if (p2Score > p1Score) { winnerId = p2Id; p1Result = 0;   p2Result = 1   }
  else                        {                  p1Result = 0.5; p2Result = 0.5 }

  const [p1, p2] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: p1Id }, select: { eloRating: true } }),
    prisma.user.findUniqueOrThrow({ where: { id: p2Id }, select: { eloRating: true } }),
  ])

  const p1NewElo = updateElo(p1.eloRating, p2.eloRating, p1Result)
  const p2NewElo = updateElo(p2.eloRating, p1.eloRating, p2Result)

  await prisma.$transaction([
    prisma.user.update({ where: { id: p1Id }, data: { eloRating: p1NewElo } }),
    prisma.user.update({ where: { id: p2Id }, data: { eloRating: p2NewElo } }),
    prisma.battle.update({
      where: { id: runtime.battleId },
      data:  { status: "finished", winnerId },
    }),
  ])

  // Achievement checks run after the ELO transaction — server-only, never client-triggered.
  const [p1Achievements, p2Achievements] = await Promise.all([
    checkAndGrantAchievements(p1Id, { trigger: "battle_finished", winnerId }),
    checkAndGrantAchievements(p2Id, { trigger: "battle_finished", winnerId }),
  ])

  const achievementMap: Record<string, string[]> = {
    [p1Id]: p1Achievements,
    [p2Id]: p2Achievements,
  }

  for (const uid of runtime.playerIds) {
    if (!uid) continue
    const view = await buildBattleView(runtime.battleId, uid)
    const sid  = findSocketOfUser(uid)
    if (sid) {
      io.to(sid).emit("battle:ended", {
        view,
        winnerId,
        outcome:         view?.outcome ?? "draw",
        newAchievements: achievementMap[uid] ?? [],
      })
    }
  }

  // Retain runtime for 60s in case of late reconnects, then GC
  setTimeout(() => battles.delete(runtime.battleId), 60_000)
}

// Emit the count of unique authenticated users online.
// Does NOT expose internal user IDs — only a headcount for UI indicators.
function broadcastPresence(): void {
  const count = new Set(
    [...io.sockets.sockets.values()]
      .filter((s) => typeof s.data.userId === "string")
      .map((s) => s.data.userId as string),
  ).size
  io.emit("presence:online", { count })
}

// ── Boot ──────────────────────────────────────────────────────────────────────

http.listen(PORT, () => {
  console.log(`[socket] listening on :${PORT} — allowing origin ${FRONTEND_URL}`)
})
