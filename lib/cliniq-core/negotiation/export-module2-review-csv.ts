/**
 * Module 2 — operational CSV: one row per fee decision, derived from the canonical JSON document.
 */

import { writeFileSync } from "node:fs"

import {
  readModule2NegotiationReviewJsonDocument,
  type Module2NegotiationReviewJsonDocument,
} from "./export-module2-review-json"

function csvEscapeCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

const CSV_HEADERS = [
  "fee_family",
  "sponsor_offer",
  "floor_price",
  "target_price",
  "zone",
  "strategy",
  "counter_offer",
  "fallback_action",
  "notes",
  "rationale",
] as const

/**
 * RFC 4180-style sheet; rows come only from `doc.review.feeDecisions` on the canonical JSON shape.
 */
export function module2FeeDecisionsToCsv(
  doc: Module2NegotiationReviewJsonDocument,
): string {
  const headerRow = CSV_HEADERS.join(",")
  const dataRows = doc.review.feeDecisions.map((d) =>
    [
      d.fee_family,
      d.sponsor_offer === null ? "" : String(d.sponsor_offer),
      String(d.floor_price),
      String(d.target_price),
      d.zone,
      d.strategy,
      String(d.counter_offer),
      d.fallback_action,
      d.notes ?? "",
      d.rationale.join(" | "),
    ]
      .map(csvEscapeCell)
      .join(","),
  )
  return [headerRow, ...dataRows].join("\n")
}

/** Write CSV by reading the canonical JSON file (single source of truth on disk). */
export function writeModule2NegotiationReviewCsvFromJsonFile(
  csvFilePath: string,
  jsonFilePath: string,
): void {
  const doc = readModule2NegotiationReviewJsonDocument(jsonFilePath)
  writeFileSync(csvFilePath, module2FeeDecisionsToCsv(doc), "utf8")
}

export type Module2ReviewCsvColumn = (typeof CSV_HEADERS)[number]
