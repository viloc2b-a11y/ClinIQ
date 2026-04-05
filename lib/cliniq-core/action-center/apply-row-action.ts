import type { ActionCenterItem } from "./types"
import type { ApplyRowActionParams, ActionCenterMutationResult } from "./mutation-types"

export function applyRowAction(params: ApplyRowActionParams): ActionCenterMutationResult {
  const { items, itemId, action } = params

  if (action !== "mark_in_progress" && action !== "mark_resolved") {
    return { items }
  }

  const index = items.findIndex((i) => i.id === itemId)
  if (index === -1) {
    return { items }
  }

  const item = items[index]

  if (action === "mark_in_progress") {
    if (item.status !== "open") {
      return { items }
    }
    const nextItem: ActionCenterItem = { ...item, status: "in_progress" }
    return {
      items: items.map((i, j) => (j === index ? nextItem : i)),
    }
  }

  if (item.status === "resolved") {
    return { items }
  }

  const nextItem: ActionCenterItem = { ...item, status: "resolved" }
  return {
    items: items.map((i, j) => (j === index ? nextItem : i)),
  }
}
