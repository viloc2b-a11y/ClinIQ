/**
 * STEP 82 — Single dashboard view: captured, at-risk, score, top actions (deterministic).
 */

import type { InvoicePackagesResult } from "../invoicing/build-invoice-packages"
import type { RevenueLeakageResult } from "./compute-revenue-leakage"
import type { PrioritizeRevenueActionsResult } from "./prioritize-revenue-actions"
import type { RevenueProtectionScoreResult } from "./revenue-protection-score"

export type BuildRevenueDashboardSnapshotInput = {
  invoices: { summary: Partial<InvoicePackagesResult["summary"]> }
  leakage: { summary: Partial<RevenueLeakageResult["summary"]> }
  score: RevenueProtectionScoreResult
  prioritizedActions: PrioritizeRevenueActionsResult
}

export type RevenueDashboardSnapshotResult = {
  data: {
    totalRevenueCaptured: number
    totalRevenueAtRisk: number
    protectionScore: number
    topActions: PrioritizeRevenueActionsResult["prioritizedActions"]
  }
  summary: {
    captured: number
    atRisk: number
    score: number
  }
  warnings: string[]
}

export function buildRevenueDashboardSnapshot(
  input: BuildRevenueDashboardSnapshotInput,
): RevenueDashboardSnapshotResult {
  const captured = input.invoices.summary.totalAmount ?? 0
  const atRisk = input.leakage.summary.totalValue ?? 0
  const scoreVal = input.score.score

  return {
    data: {
      totalRevenueCaptured: captured,
      totalRevenueAtRisk: atRisk,
      protectionScore: scoreVal,
      topActions: input.prioritizedActions.prioritizedActions.slice(0, 5),
    },
    summary: {
      captured,
      atRisk,
      score: scoreVal,
    },
    warnings:
      scoreVal < 80
        ? ["Revenue risk requires immediate attention"]
        : [],
  }
}
