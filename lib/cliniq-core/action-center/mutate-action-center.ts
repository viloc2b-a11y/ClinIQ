import type {
  ActionCenterMutationApiResponse,
  ActionCenterMutationRequest,
} from "./mutation-api-types"
import { getMockServerActionCenterState, setMockServerActionCenterState } from "./mock-server-state"
import { applyRowActionToActionCenterResult } from "./apply-row-action-to-result"
import type { ActionCenterRowAction } from "./row-actions"

const SUPPORTED_SERVER_ACTIONS: ActionCenterRowAction[] = ["mark_in_progress", "mark_resolved"]

export function mutateActionCenter(request: ActionCenterMutationRequest): ActionCenterMutationApiResponse {
  if (typeof request?.itemId !== "string" || request.itemId.trim() === "") {
    return { ok: false, error: "invalid_request" }
  }
  if (typeof request?.action !== "string" || request.action.trim() === "") {
    return { ok: false, error: "invalid_request" }
  }

  const action = request.action as ActionCenterRowAction
  if (!SUPPORTED_SERVER_ACTIONS.includes(action)) {
    return { ok: false, error: "unsupported_action" }
  }

  const itemId = request.itemId.trim()

  try {
    const current = getMockServerActionCenterState()
    const exists = current.items.some((i) => i.id === itemId)
    if (!exists) {
      return { ok: false, error: "item_not_found" }
    }

    const next = applyRowActionToActionCenterResult({
      result: current,
      itemId,
      action,
    })
    setMockServerActionCenterState(next)

    return {
      ok: true,
      data: {
        itemId,
        action,
        result: next,
      },
    }
  } catch {
    return { ok: false, error: "failed_to_apply_action" }
  }
}
