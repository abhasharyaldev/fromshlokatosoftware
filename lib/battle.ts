import { randomInt } from "crypto"
import type { Prisma } from "@prisma/client"
import { prisma } from "./prisma"

export const TOTAL_ROUNDS = 5
export const ELO_K = 32

// Room code alphabet — no O/0/I/1/L to avoid confusion when typing
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
const CODE_LENGTH = 6

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BattleRound {
  index:     number
  questionId: string
  answers:   Record<string, { answer: string; correct: boolean; submittedAt: string }>
}

export type BattleStatus = "waiting" | "active" | "finished" | "abandoned"

export type BattleOutcome = "win" | "loss" | "draw"

export interface BattleView {
  id:        string
  roomCode:  string
  status:    BattleStatus
  totalRounds: number
  me: {
    userId:    string
    username:  string
    score:     number
    eloBefore?: number
    eloAfter?:  number
  }
  opponent: {
    username:  string
    score:     number
  } | null
  currentRoundIndex: number      // = how many rounds I've answered (0..totalRounds)
  hasAnswered:       boolean     // false if there's an open round waiting on me
  currentQuestion?: {
    prompt:  string
    options: string[]
  }
  completedRounds: {
    index:            number
    prompt:           string
    correctAnswer:    string
    explanation:      string | null
    myAnswer:         string
    myCorrect:        boolean
    opponentAnswered: boolean
    opponentCorrect?: boolean
  }[]
  isCreator: boolean
  canStart:  boolean             // player1 can hit "Start" (status waiting + both joined)
  winnerId:  string | null
  outcome?:  BattleOutcome
}

// ── Room code generation ──────────────────────────────────────────────────────

function makeCode(): string {
  let out = ""
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += ALPHABET[randomInt(0, ALPHABET.length)]
  }
  return out
}

export async function generateUniqueRoomCode(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = makeCode()
    const existing = await prisma.battle.findUnique({
      where: { roomCode: code },
      select: { id: true },
    })
    if (!existing) return code
  }
  throw new Error("Could not generate a unique room code")
}

// ── ELO ───────────────────────────────────────────────────────────────────────

// Standard Elo update with K=32. myScore: 1 (win), 0.5 (draw), 0 (loss).
export function updateElo(
  myRating: number,
  oppRating: number,
  myScore: 0 | 0.5 | 1
): number {
  const expected = 1 / (1 + Math.pow(10, (oppRating - myRating) / 400))
  return Math.round(myRating + ELO_K * (myScore - expected))
}

// ── Question selection ────────────────────────────────────────────────────────

// Pick TOTAL_ROUNDS random MCQ question IDs. MVP scope: MCQ only.
export async function pickBattleQuestions(): Promise<string[]> {
  const all = await prisma.question.findMany({
    where: { type: "mcq" },
    select: { id: true },
  })

  if (all.length < TOTAL_ROUNDS) {
    throw new Error(`Not enough MCQ questions in DB (need ${TOTAL_ROUNDS}, found ${all.length})`)
  }

  // Fisher-Yates shuffle, take first N
  const shuffled = [...all]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1)
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, TOTAL_ROUNDS).map((q) => q.id)
}

// ── Round parsing ─────────────────────────────────────────────────────────────

// Parse the JSON rounds column into typed BattleRound[]. Defensive against
// malformed data.
export function parseRounds(raw: Prisma.JsonValue): BattleRound[] {
  if (!Array.isArray(raw)) return []
  return raw as unknown as BattleRound[]
}

// Answer normalization used for grading. Case-insensitive, trimmed.
export function normalize(s: string): string {
  return s.trim().toLowerCase()
}
