/**
 * Protocol Classification v1 — canonical JSON export (full run: classify + Module 5 bridge).
 */

import { readFileSync, writeFileSync } from "node:fs"

import type { ExpectedBillable } from "../post-award-ledger/types"
import type { ProtocolClassifiedActivity } from "./types"

export const PROTOCOL_CLASSIFICATION_JSON_SCHEMA_VERSION =
  "1.0-protocol-classification" as const

export type ProtocolClassificationJsonDocument = {
  schemaVersion: typeof PROTOCOL_CLASSIFICATION_JSON_SCHEMA_VERSION
  exportedAt: string
  classifiedActivities: ProtocolClassifiedActivity[]
  expectedBillables: ExpectedBillable[]
  deferredConditionals: ProtocolClassifiedActivity[]
  ignoredNonBillables: ProtocolClassifiedActivity[]
}

export function buildProtocolClassificationJsonDocument(params: {
  classifiedActivities: ProtocolClassifiedActivity[]
  expectedBillables: ExpectedBillable[]
  deferredConditionals: ProtocolClassifiedActivity[]
  ignoredNonBillables: ProtocolClassifiedActivity[]
  exportedAt?: string
}): ProtocolClassificationJsonDocument {
  return {
    schemaVersion: PROTOCOL_CLASSIFICATION_JSON_SCHEMA_VERSION,
    exportedAt: params.exportedAt ?? new Date().toISOString(),
    classifiedActivities: params.classifiedActivities,
    expectedBillables: params.expectedBillables,
    deferredConditionals: params.deferredConditionals,
    ignoredNonBillables: params.ignoredNonBillables,
  }
}

export function serializeProtocolClassificationJson(
  doc: ProtocolClassificationJsonDocument,
): string {
  return JSON.stringify(doc, null, 2)
}

export function writeProtocolClassificationJsonDocument(
  filePath: string,
  doc: ProtocolClassificationJsonDocument,
): void {
  writeFileSync(filePath, serializeProtocolClassificationJson(doc), "utf8")
}

/** Read canonical JSON from disk (CSV export reuses this path). */
export function readProtocolClassificationJsonDocument(
  filePath: string,
): ProtocolClassificationJsonDocument {
  const text = readFileSync(filePath, "utf8")
  return JSON.parse(text) as ProtocolClassificationJsonDocument
}
