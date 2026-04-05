import { bootstrapMemoryActionCenter } from "@/lib/cliniq-core/action-center/bootstrap-memory-action-center"
import { getActionCenterFromPersistence } from "@/lib/cliniq-core/action-center/get-action-center-from-persistence"

export async function GET() {
  await bootstrapMemoryActionCenter()
  const result = await getActionCenterFromPersistence()

  if (!result.ok) {
    return Response.json(result, { status: 500 })
  }

  return Response.json(result, { status: 200 })
}
