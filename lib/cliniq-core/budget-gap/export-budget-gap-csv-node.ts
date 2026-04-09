/**
 * Node-only CSV write from JSON path. Import from scripts or server code only.
 */

import { writeFileSync } from "node:fs"

import { budgetGapAnalysisToCsv } from "./export-format"
import { readBudgetGapAnalysisJsonDocument } from "./export-budget-gap-json-node"

export function writeBudgetGapAnalysisCsvFromJsonFile(
  csvFilePath: string,
  jsonFilePath: string,
): void {
  const doc = readBudgetGapAnalysisJsonDocument(jsonFilePath)
  writeFileSync(csvFilePath, budgetGapAnalysisToCsv(doc), "utf8")
}
