/**
 * Module 2 — canonical JSON export for `IngestSponsorOfferResult` (audit / product hand-off).
 */

import { readFileSync, writeFileSync } from "node:fs"

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

export function writeModule2NegotiationReviewJsonDocument(
  filePath: string,
  doc: Module2NegotiationReviewJsonDocument,
): void {
  writeFileSync(filePath, JSON.stringify(doc, null, 2), "utf8")
}

export function writeModule2NegotiationReviewJson(
  filePath: string,
  result: IngestSponsorOfferResult,
  options?: { exportedAt?: string },
): void {
  writeModule2NegotiationReviewJsonDocument(
    filePath,
    buildModule2NegotiationReviewJsonDocument(result, options),
  )
}

/** Read canonical JSON from disk (e.g. to derive CSV from the same bytes as written). */
export function readModule2NegotiationReviewJsonDocument(
  filePath: string,
): Module2NegotiationReviewJsonDocument {
  const text = readFileSync(filePath, "utf8")
  return JSON.parse(text) as Module2NegotiationReviewJsonDocument
}
