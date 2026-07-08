"use server"

import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import argon2 from "argon2"
import { prisma } from "@/lib/prisma"
import { registerSchema, loginSchema } from "@/lib/validations"
import { SESSION_COOKIE } from "@/lib/session"
import { rateLimit, getIp } from "@/lib/rate-limit"

// Lazily generated once per process — a valid argon2id hash used as a timing
// dummy so argon2.verify always runs even when the email doesn't exist.
// This prevents timing-based user enumeration on the login route.
let _timingHash: string | null = null
async function timingHash(): Promise<string> {
  if (!_timingHash) {
    _timingHash = await argon2.hash("__fsts_timing_dummy__", { type: argon2.argon2id })
  }
  return _timingHash
}

// ── Register ──────────────────────────────────────────────────────────────────

export async function register(_prev: unknown, formData: FormData) {
  // Rate limit: 5 signups per 10 minutes per IP
  const ip = getIp((await headers()) as unknown as Headers)
  const { allowed } = await rateLimit(`signup:${ip}`, 5, 10 * 60 * 1000)
  if (!allowed) {
    return { error: "Too many attempts. Please wait a few minutes and try again." }
  }

  const parsed = registerSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0]
    return { error: first ?? "Invalid input. Please check your details." }
  }

  const { username, email, password } = parsed.data

  // Check uniqueness — safe to disclose on signup (user is choosing these values)
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { email: true, username: true },
  })

  if (existing?.email === email) {
    return { error: "This email is already registered." }
  }
  if (existing?.username === username) {
    return { error: "This username is already taken." }
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id })

  const user = await prisma.user.create({
    data: { username, email, passwordHash },
    select: { id: true },
  })

  const store = await cookies()
  store.set(SESSION_COOKIE.name, user.id, SESSION_COOKIE.options)

  redirect("/dashboard")
}

// ── Login ─────────────────────────────────────────────────────────────────────

export async function login(_prev: unknown, formData: FormData) {
  // Rate limit: 8 attempts per 15 minutes per IP
  const ip = getIp((await headers()) as unknown as Headers)
  const { allowed } = await rateLimit(`login:${ip}`, 8, 15 * 60 * 1000)
  if (!allowed) {
    return { error: "Too many attempts. Please wait a few minutes and try again." }
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    // Generic message — don't reveal which field failed
    return { error: "Invalid email or password." }
  }

  const { email, password } = parsed.data

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  })

  // Always run argon2.verify — prevents timing attacks that reveal whether an
  // email is registered. If user not found, compare against a dummy hash.
  const hashToVerify = user?.passwordHash ?? (await timingHash())
  let valid = false
  try {
    valid = await argon2.verify(hashToVerify, password)
  } catch {
    valid = false
  }

  // Single generic message — never reveal whether the email exists
  if (!user || !valid) {
    return { error: "Invalid email or password." }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastActiveAt: new Date() },
  })

  const store = await cookies()
  store.set(SESSION_COOKIE.name, user.id, SESSION_COOKIE.options)

  redirect("/dashboard")
}

// ── Logout ────────────────────────────────────────────────────────────────────

export async function logout() {
  const store = await cookies()
  store.delete(SESSION_COOKIE.name)
  redirect("/")
}
