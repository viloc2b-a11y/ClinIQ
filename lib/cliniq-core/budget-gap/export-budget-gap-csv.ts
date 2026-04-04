/**
 * Module 3 — operational CSV derived from the canonical budget-gap JSON document.
 */

import { writeFileSync } from "node:fs"

import {
  readBudgetGapAnalysisJsonDocument,
  type BudgetGapAnalysisJsonDocument,
} from "./export-budget-gap-json"

function csvEscapeCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

const CSV_HEADERS = [
  "line_code",
  "category",
  "label",
  "visit_name",
  "status",
  "internal_total",
  "sponsor_total_offer",
  "gap_amount",
  "notes_or_rationale",
] as const

function rowFromGapLine(
  l: BudgetGapAnalysisJsonDocument["gapLines"][number],
): string[] {
  return [
    l.lineCode,
    l.category,
    l.label,
    l.visitName,
    l.status,
    String(l.internalTotal),
    String(l.sponsorTotalOffer),
    String(l.gapAmount),
    l.notes ?? "",
  ].map(csvEscapeCell)
}

function rowFromMissing(
  m: BudgetGapAnalysisJsonDocument["missingInvoiceables"][number],
): string[] {
  return [
    m.lineCode,
    m.category,
    m.label,
    m.visitName,
    m.status,
    String(m.internalTotal),
    "0",
    String(m.gapAmount),
    m.notes ?? "",
  ].map(csvEscapeCell)
}

/**
 * One row per `gapLines` entry, then one per `missingInvoiceable` (RFC 4180-style).
 */
export function budgetGapAnalysisToCsv(doc: BudgetGapAnalysisJsonDocument): string {
  const headerRow = CSV_HEADERS.join(",")
  const dataRows = [
    ...doc.gapLines.map((l) => rowFromGapLine(l).join(",")),
    ...doc.missingInvoiceables.map((m) => rowFromMissing(m).join(",")),
  ]
  return [headerRow, ...dataRows].join("\n")
}

export function writeBudgetGapAnalysisCsvFromJsonFile(
  csvFilePath: string,
  jsonFilePath: string,
): void {
  const doc = readBudgetGapAnalysisJsonDocument(jsonFilePath)
  writeFileSync(csvFilePath, budgetGapAnalysisToCsv(doc), "utf8")
}

export type BudgetGapAnalysisCsvColumn = (typeof CSV_HEADERS)[number]
