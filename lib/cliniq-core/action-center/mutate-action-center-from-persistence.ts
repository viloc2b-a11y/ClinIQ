/**
 * STEP 4 — Mutations via {@link getActionCenterPersistenceAdapter}: list → validate → next status →
 * `updateActionItemStatus` + `appendActionItemEvent` (on change) → list again → summary.
 * Supported: `mark_in_progress`, `mark_resolved` only. JSON contract: {@link ActionCenterMutationApiResponse}.
 */
import type {
  ActionCenterMutationApiResponse,
  ActionCenterMutationRequest,
} from "./mutation-api-types"
import type { ActionCenterRowAction } from "./row-actions"
import { getActionCenterPersistenceAdapter } from "./get-persistence-adapter"
import { recomputeActionCenterSummary } from "./recompute-summary"

const SUPPORTED_SERVER_ACTIONS = ["mark_in_progress", "mark_resolved"] as const

export async function mutateActionCenterFromPersistence(
  request: ActionCenterMutationRequest,
): Promise<ActionCenterMutationApiResponse> {
  try {
    if (
      typeof request?.itemId !== "string" ||
      request.itemId.trim() === "" ||
      typeof request?.action !== "string" ||
      request.action.trim() === ""
    ) {
      return { ok: false, error: "invalid_request" }
    }

    const itemId = request.itemId.trim()
    const action = request.action.trim()

    if (!(SUPPORTED_SERVER_ACTIONS as readonly string[]).includes(action)) {
      return { ok: false, error: "unsupported_action" }
    }

    const adapter = getActionCenterPersistenceAdapter()
    const currentItems = await adapter.listActionItems()
    const currentItem = currentItems.find((item) => item.id === itemId)

    if (!currentItem) {
      return { ok: false, error: "item_not_found" }
    }

    const nextStatus =
      action === "mark_in_progress"
        ? currentItem.status === "open"
          ? "in_progress"
          : currentItem.status
        : "resolved"

    if (nextStatus !== currentItem.status) {
      await adapter.updateActionItemStatus({
        itemId: currentItem.id,
        status: nextStatus,
      })

      await adapter.appendActionItemEvent({
        actionItemId: currentItem.id,
        eventType: action,
        fromStatus: currentItem.status,
        toStatus: nextStatus,
        actorType: "system",
        payload: {},
      })
    }

    const nextItems = await adapter.listActionItems()

    return {
      ok: true,
      data: {
        itemId,
        action: action as ActionCenterRowAction,
        result: {
          items: nextItems,
          summary: recomputeActionCenterSummary(nextItems),
        },
      },
    }
  } catch {
    return { ok: false, error: "failed_to_apply_action" }
  }
}
