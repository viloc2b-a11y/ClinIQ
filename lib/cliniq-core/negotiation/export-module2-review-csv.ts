/**
 * Module 2 — operational CSV export: one row per fee decision from `IngestSponsorOfferResult.review.feeDecisions`.
 */

import { writeFileSync } from "node:fs"

import type { IngestSponsorOfferResult } from "./ingest-sponsor-offer"

function csvEscapeCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

const CSV_HEADERS = [
  "fee_family",
  "label",
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
 * RFC 4180-style single sheet; derived only from `result.review.feeDecisions`.
 */
export function module2FeeDecisionsToCsv(result: IngestSponsorOfferResult): string {
  const headerRow = CSV_HEADERS.join(",")
  const dataRows = result.review.feeDecisions.map((d) =>
    [
      d.fee_family,
      d.label,
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

export function writeModule2NegotiationReviewCsv(
  filePath: string,
  result: IngestSponsorOfferResult,
): void {
  writeFileSync(filePath, module2FeeDecisionsToCsv(result), "utf8")
}

export type Module2ReviewCsvColumn = (typeof CSV_HEADERS)[number]
