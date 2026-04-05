import { getActionCenterPersistenceAdapter } from "./get-persistence-adapter"
import { recomputeActionCenterSummary } from "./recompute-summary"
import type { ActionCenterApiResponse } from "./api-types"

export async function getActionCenterFromPersistence(): Promise<ActionCenterApiResponse> {
  try {
    const adapter = getActionCenterPersistenceAdapter()
    const items = await adapter.listActionItems()

    return {
      ok: true,
      data: {
        items,
        summary: recomputeActionCenterSummary(items),
      },
    }
  } catch {
    return {
      ok: false,
      error: "failed_to_build_action_center",
    }
  }
}
