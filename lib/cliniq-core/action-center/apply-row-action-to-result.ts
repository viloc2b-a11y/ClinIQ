import type { ActionCenterResult } from "./types"
import type { ActionCenterRowAction } from "./row-actions"
import { applyRowAction } from "./apply-row-action"
import { recomputeActionCenterSummary } from "./recompute-summary"

export function applyRowActionToActionCenterResult(params: {
  result: ActionCenterResult
  itemId: string
  action: ActionCenterRowAction
}): ActionCenterResult {
  const nextItems = applyRowAction({
    items: params.result.items,
    itemId: params.itemId,
    action: params.action,
  }).items

  return {
    items: nextItems,
    summary: recomputeActionCenterSummary(nextItems),
  }
}
