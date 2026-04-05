import type { ActionCenterItem, ActionCenterSummary } from "./types"

export function recomputeActionCenterSummary(items: ActionCenterItem[]): ActionCenterSummary {
  const byOwnerRole: Record<string, number> = {}
  const byActionType: Record<string, number> = {}
  let totalOpen = 0
  let totalHighPriority = 0
  let totalMissingAmount = 0

  for (const it of items) {
    if (it.status === "resolved") continue

    totalOpen += 1
    if (it.priority === "high") totalHighPriority += 1
    totalMissingAmount += it.missingAmount

    const role = it.ownerRole
    const action = it.actionType
    byOwnerRole[role] = (byOwnerRole[role] ?? 0) + 1
    byActionType[action] = (byActionType[action] ?? 0) + 1
  }

  return {
    totalOpen,
    totalHighPriority,
    totalMissingAmount,
    byOwnerRole,
    byActionType,
  }
}
