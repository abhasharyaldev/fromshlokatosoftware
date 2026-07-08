import { notFound } from "next/navigation"
import { requireSession } from "@/lib/session"
import { buildBattleView } from "@/lib/battle-view"
import { BattleRoom } from "./BattleRoom"

export default async function BattleRoomPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireSession()
  const { id } = await params

  const view = await buildBattleView(id, session.id)
  if (!view) notFound()

  return <BattleRoom initial={view} />
}
