/**
 * Module 3 — canonical JSON export for `CompareBudgetResult` (budget gap analyzer).
 */

import { readFileSync, writeFileSync } from "node:fs"

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

export function writeBudgetGapAnalysisJsonDocument(
  filePath: string,
  doc: BudgetGapAnalysisJsonDocument,
): void {
  writeFileSync(filePath, JSON.stringify(doc, null, 2), "utf8")
}

export function writeBudgetGapAnalysisJson(
  filePath: string,
  result: CompareBudgetResult,
  options?: { exportedAt?: string },
): void {
  writeBudgetGapAnalysisJsonDocument(
    filePath,
    buildBudgetGapAnalysisJsonDocument(result, options),
  )
}

/** Read canonical JSON from disk (e.g. to derive CSV from the same bytes as written). */
export function readBudgetGapAnalysisJsonDocument(
  filePath: string,
): BudgetGapAnalysisJsonDocument {
  const text = readFileSync(filePath, "utf8")
  return JSON.parse(text) as BudgetGapAnalysisJsonDocument
}
