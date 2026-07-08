import { requireSession } from "@/lib/session"
import { BattleLanding } from "./BattleLanding"

export default async function BattlePage() {
  const user = await requireSession()
  return <BattleLanding eloRating={user.eloRating} />
}
