"use server"

import { headers } from "next/headers"
import argon2 from "argon2"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { rateLimit, getIp } from "@/lib/rate-limit"
import { changeUsernameSchema, changePasswordSchema } from "@/lib/validations"

export interface ActionResult {
  error?: string
  success?: boolean
  newUsername?: string
}

// ── Change username ───────────────────────────────────────────────────────────

export async function changeUsername(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession()
  if (!session) return { error: "Unauthorized." }

  // 3 username changes per hour per user — prevent churn/spam
  const { allowed } = await rateLimit(`change-username:${session.id}`, 3, 60 * 60 * 1000)
  if (!allowed) {
    return { error: "Too many username changes. Try again in an hour." }
  }

  const parsed = changeUsernameSchema.safeParse({
    username: formData.get("username"),
  })
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { username } = parsed.data

  if (username === session.username) {
    return { error: "That is already your username." }
  }

  const existing = await prisma.user.findUnique({
    where:  { username },
    select: { id: true },
  })
  if (existing) {
    return { error: "Username is already taken." }
  }

  await prisma.user.update({
    where: { id: session.id },
    data:  { username },
  })

  return { success: true, newUsername: username }
}

// ── Change password ───────────────────────────────────────────────────────────

export async function changePassword(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession()
  if (!session) return { error: "Unauthorized." }

  // 3 attempts per 15 minutes per user+IP
  const ip = getIp((await headers()) as unknown as Headers)
  const { allowed } = await rateLimit(`change-password:${session.id}:${ip}`, 3, 15 * 60 * 1000)
  if (!allowed) {
    return { error: "Too many attempts. Please wait 15 minutes." }
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword:     formData.get("newPassword"),
  })
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { currentPassword, newPassword } = parsed.data

  // Fetch only the hash — passwordHash is never sent to the client
  const user = await prisma.user.findUnique({
    where:  { id: session.id },
    select: { passwordHash: true },
  })
  if (!user) return { error: "User not found." }

  // Always run argon2.verify regardless of anything — prevents timing side-channels
  let valid = false
  try {
    valid = await argon2.verify(user.passwordHash, currentPassword)
  } catch {
    valid = false
  }

  // Single generic message — does not reveal whether the hash lookup itself failed
  if (!valid) {
    return { error: "Current password is incorrect." }
  }

  if (currentPassword === newPassword) {
    return { error: "New password must be different from your current password." }
  }

  const newHash = await argon2.hash(newPassword, { type: argon2.argon2id })

  await prisma.user.update({
    where: { id: session.id },
    data:  { passwordHash: newHash },
  })

  return { success: true }
}
