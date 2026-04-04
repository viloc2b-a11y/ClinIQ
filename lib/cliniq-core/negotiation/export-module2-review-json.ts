/**
 * Module 2 — canonical JSON export for `IngestSponsorOfferResult` (audit / product hand-off).
 */

import { writeFileSync } from "node:fs"

import type { IngestSponsorOfferResult } from "./ingest-sponsor-offer"

export const MODULE2_REVIEW_JSON_SCHEMA_VERSION = "2.0-module2-review" as const

export type Module2NegotiationReviewJsonDocument = IngestSponsorOfferResult & {
  schemaVersion: typeof MODULE2_REVIEW_JSON_SCHEMA_VERSION
  exportedAt: string
}

export function buildModule2NegotiationReviewJsonDocument(
  result: IngestSponsorOfferResult,
  options?: { exportedAt?: string },
): Module2NegotiationReviewJsonDocument {
  return {
    schemaVersion: MODULE2_REVIEW_JSON_SCHEMA_VERSION,
    exportedAt: options?.exportedAt ?? new Date().toISOString(),
    ...result,
  }
}

export function serializeModule2NegotiationReviewJson(
  result: IngestSponsorOfferResult,
  options?: { exportedAt?: string },
): string {
  return JSON.stringify(
    buildModule2NegotiationReviewJsonDocument(result, options),
    null,
    2,
  )
}

export function writeModule2NegotiationReviewJson(
  filePath: string,
  result: IngestSponsorOfferResult,
  options?: { exportedAt?: string },
): void {
  writeFileSync(filePath, serializeModule2NegotiationReviewJson(result, options), "utf8")
}
