/**
 * Module 3 — canonical JSON export for `CompareBudgetResult` (budget gap analyzer).
 * Browser-safe. For read/write to disk use `./export-budget-gap-json-node`.
 */

import type { CompareBudgetResult } from "./types"

export const BUDGET_GAP_ANALYSIS_JSON_SCHEMA_VERSION = "1.0-budget-gap-analysis" as const

export type BudgetGapAnalysisJsonDocument = CompareBudgetResult & {
  schemaVersion: typeof BUDGET_GAP_ANALYSIS_JSON_SCHEMA_VERSION
  exportedAt: string
}

export function buildBudgetGapAnalysisJsonDocument(
  result: CompareBudgetResult,
  options?: { exportedAt?: string },
): BudgetGapAnalysisJsonDocument {
  return {
    schemaVersion: BUDGET_GAP_ANALYSIS_JSON_SCHEMA_VERSION,
    exportedAt: options?.exportedAt ?? new Date().toISOString(),
    ...result,
  }
}

export function serializeBudgetGapAnalysisJson(
  result: CompareBudgetResult,
  options?: { exportedAt?: string },
): string {
  return JSON.stringify(buildBudgetGapAnalysisJsonDocument(result, options), null, 2)
}
