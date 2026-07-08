import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { buildBattleView } from "@/lib/battle-view"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const { id } = await params
  const view = await buildBattleView(id, session.id)

  if (!view) {
    // Either not found OR user is not a player — 404 for both to avoid enumeration
    return NextResponse.json({ error: "Battle not found." }, { status: 404 })
  }

  return NextResponse.json({ battle: view })
}
