import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import argon2 from "argon2"
import { prisma } from "@/lib/prisma"
import { loginSchema } from "@/lib/validations"
import { SESSION_COOKIE } from "@/lib/session"
import { rateLimit, getIp } from "@/lib/rate-limit"

// Lazily generated dummy hash — same pattern as in the Server Action.
let _timingHash: string | null = null
async function timingHash(): Promise<string> {
  if (!_timingHash) {
    _timingHash = await argon2.hash("__fsts_timing_dummy__", { type: argon2.argon2id })
  }
  return _timingHash
}

export async function POST(req: NextRequest) {
  // Rate limit: 8 attempts per 15 minutes per IP
  const { allowed } = await rateLimit(`login:${getIp(req.headers)}`, 8, 15 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a few minutes and try again." },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 400 })
  }

  const { email, password } = parsed.data

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, username: true, email: true, xp: true, level: true, passwordHash: true },
  })

  const hashToVerify = user?.passwordHash ?? (await timingHash())
  let valid = false
  try {
    valid = await argon2.verify(hashToVerify, password)
  } catch {
    valid = false
  }

  if (!user || !valid) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 })
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } })

  const store = await cookies()
  store.set(SESSION_COOKIE.name, user.id, SESSION_COOKIE.options)

  const { passwordHash: _, ...safeUser } = user
  return NextResponse.json({ user: safeUser })
}
