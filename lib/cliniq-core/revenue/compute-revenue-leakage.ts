/**
 * STEP 81 — Quantify revenue leakage from action-center / diagnostic signals ($).
 * Each item stays traceable via `recordId` (billable instance) and/or `eventLogId`.
 */

export type LeakageActionItem = {
  id: string
  recordId?: string
  eventLogId?: string
  /** Leakage in currency units (deterministic; positive = unrealized / gap). */
  leakageValue: number
  reason?: string
}

export type ComputeRevenueLeakageInput = {
  actionItems: LeakageActionItem[]
}

export type RevenueLeakageLine = {
  id: string
  recordId?: string
  eventLogId?: string
  leakageValue: number
  reason?: string
}

export type RevenueLeakageResult = {
  data: RevenueLeakageLine[]
  summary: {
    totalItems: number
    totalValue: number
  }
  warnings: string[]
}

export function computeRevenueLeakage(
  input: ComputeRevenueLeakageInput,
): RevenueLeakageResult {
  const warnings: string[] = []
  const sorted = [...input.actionItems].sort((a, b) => a.id.localeCompare(b.id))

  if (sorted.some((x) => x.leakageValue < 0)) {
    warnings.push("Negative leakage values present (credits or adjustments).")
  }

  const data: RevenueLeakageLine[] = sorted.map((a) => ({
    id: a.id,
    recordId: a.recordId,
    eventLogId: a.eventLogId,
    leakageValue: a.leakageValue,
    reason: a.reason,
  }))

  const totalValue = data.reduce((s, x) => s + x.leakageValue, 0)

  return {
    data,
    summary: {
      totalItems: data.length,
      totalValue,
    },
    warnings,
  }
}
