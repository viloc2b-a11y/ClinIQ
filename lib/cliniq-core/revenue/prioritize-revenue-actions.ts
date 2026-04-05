/**
 * STEP 82 — Prioritize revenue actions by dollar impact (deterministic).
 * Traceability preserved via `recordId` / `eventLogId` on each item when present.
 *
 * Uses `estimatedValue` when set; otherwise `leakageValue` (STEP 81 leakage signals) so the same
 * `actionItems` array can flow from {@link computeRevenueLeakage} without reshaping.
 */

import type { LeakageActionItem } from "./compute-revenue-leakage"

export type PrioritizeRevenueActionInputItem = LeakageActionItem & {
  estimatedValue?: number
}

export type PrioritizedRevenueAction = PrioritizeRevenueActionInputItem & {
  priorityScore: number
}

export type PrioritizeRevenueActionsInput = {
  actionItems: PrioritizeRevenueActionInputItem[]
}

export type PrioritizeRevenueActionsResult = {
  prioritizedActions: PrioritizedRevenueAction[]
  summary: {
    total: number
    highestValue: number
  }
  warnings: string[]
}

function dollarImpact(a: PrioritizeRevenueActionInputItem): number {
  if (a.estimatedValue != null) {
    return Number(a.estimatedValue)
  }
  return Number(a.leakageValue || 0)
}

export function prioritizeRevenueActions(
  input: PrioritizeRevenueActionsInput,
): PrioritizeRevenueActionsResult {
  const prioritized = [...input.actionItems]
    .map((a) => ({
      ...a,
      priorityScore: dollarImpact(a),
    }))
    .sort((a, b) => {
      const diff = b.priorityScore - a.priorityScore
      if (diff !== 0) return diff
      return a.id.localeCompare(b.id)
    })

  return {
    prioritizedActions: prioritized,
    summary: {
      total: prioritized.length,
      highestValue: prioritized[0]?.priorityScore ?? 0,
    },
    warnings: [],
  }
}
