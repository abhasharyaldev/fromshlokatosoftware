import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import argon2 from "argon2"
import { prisma } from "@/lib/prisma"
import { registerSchema } from "@/lib/validations"
import { SESSION_COOKIE } from "@/lib/session"
import { rateLimit, getIp } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  // Rate limit: 5 signups per 10 minutes per IP
  const { allowed } = await rateLimit(`signup:${getIp(req.headers)}`, 5, 10 * 60 * 1000)
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

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input.", fields: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { username, email, password } = parsed.data

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { email: true, username: true },
  })

  if (existing?.email === email) {
    return NextResponse.json({ error: "This email is already registered." }, { status: 409 })
  }
  if (existing?.username === username) {
    return NextResponse.json({ error: "This username is already taken." }, { status: 409 })
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id })

  const user = await prisma.user.create({
    data: { username, email, passwordHash },
    select: { id: true, username: true, email: true, xp: true, level: true, createdAt: true },
  })

  const store = await cookies()
  store.set(SESSION_COOKIE.name, user.id, SESSION_COOKIE.options)

  return NextResponse.json({ user }, { status: 201 })
}
