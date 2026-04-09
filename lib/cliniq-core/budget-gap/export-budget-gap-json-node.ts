/**
 * Node-only file I/O for budget-gap JSON. Import from scripts or server code only.
 */

import { readFileSync, writeFileSync } from "node:fs"

import {
  buildBudgetGapAnalysisJsonDocument,
  type BudgetGapAnalysisJsonDocument,
} from "./export-budget-gap-json"
import type { CompareBudgetResult } from "./types"

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
