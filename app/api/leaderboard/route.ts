import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

const LIMIT = 50
const MAX_LIMIT = 50

const querySchema = z.object({
  type:  z.enum(["xp", "elo"]).default("xp"),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(LIMIT),
})

export async function GET(req: NextRequest) {
  const parsed = querySchema.safeParse({
    type:  req.nextUrl.searchParams.get("type")  ?? undefined,
    limit: req.nextUrl.searchParams.get("limit") ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters." }, { status: 400 })
  }

  const { type, limit } = parsed.data
  const orderKey = type === "xp" ? "xp" : "eloRating"

  const rows = await prisma.user.findMany({
    orderBy: [{ [orderKey]: "desc" }, { createdAt: "asc" }],
    take: limit,
    // ONLY these fields — no email, no passwordHash, no lastActiveAt, no ids
    select: {
      username:   true,
      level:      true,
      xp:         true,
      eloRating:  true,
    },
  })

  const leaderboard = rows.map((u, i) => ({
    rank:      i + 1,
    username:  u.username,
    level:     u.level,
    xp:        u.xp,
    eloRating: u.eloRating,
  }))

  return NextResponse.json({ type, leaderboard })
}
