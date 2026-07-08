import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"

export async function GET() {
  const user = await getSession()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // passwordHash is never in SessionUser — safe to return directly
  return NextResponse.json({ user })
}
