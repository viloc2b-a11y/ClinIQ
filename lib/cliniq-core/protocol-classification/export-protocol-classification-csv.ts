/**
 * Protocol Classification v1 — operational CSV derived from canonical JSON on disk.
 */

import { writeFileSync } from "node:fs"

import {
  readProtocolClassificationJsonDocument,
  type ProtocolClassificationJsonDocument,
} from "./export-protocol-classification-json"
import type { ProtocolClassifiedActivity } from "./types"

function csvEscapeCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function activityKey(a: Pick<ProtocolClassifiedActivity, "studyId" | "activityId">): string {
  return JSON.stringify([a.studyId.trim(), a.activityId.trim()])
}

function deferredKeySet(doc: ProtocolClassificationJsonDocument): Set<string> {
  const s = new Set<string>()
  for (const a of doc.deferredConditionals) {
    s.add(activityKey(a))
  }
  return s
}

const CSV_HEADERS = [
  "study_id",
  "activity_id",
  "visit_name",
  "activity_type",
  "classification",
  "line_code",
  "fee_code",
  "rationale",
  "conditions",
  "expected_revenue",
  "deferred_flag",
] as const

function rowFromClassified(
  a: ProtocolClassifiedActivity,
  deferredKeys: Set<string>,
): string[] {
  const conditionsJson = JSON.stringify(a.conditions ?? [])
  const expectedRevenue =
    a.expectedRevenue !== undefined && Number.isFinite(a.expectedRevenue)
      ? String(a.expectedRevenue)
      : ""
  const deferred = deferredKeys.has(activityKey(a)) ? "true" : "false"
  return [
    a.studyId,
    a.activityId,
    a.visitName,
    a.activityType ?? "",
    a.classification,
    a.lineCode ?? "",
    a.feeCode ?? "",
    a.rationale,
    conditionsJson,
    expectedRevenue,
    deferred,
  ].map(csvEscapeCell)
}

/**
 * One row per `classifiedActivities` entry; `deferred_flag` matches membership in `deferredConditionals` from the same document.
 */
export function protocolClassificationToCsv(
  doc: ProtocolClassificationJsonDocument,
): string {
  const deferredKeys = deferredKeySet(doc)
  const headerRow = CSV_HEADERS.join(",")
  const dataRows = doc.classifiedActivities.map((a) =>
    rowFromClassified(a, deferredKeys).join(","),
  )
  return [headerRow, ...dataRows].join("\n")
}

export function writeProtocolClassificationCsvFromJsonFile(
  csvFilePath: string,
  jsonFilePath: string,
): void {
  const doc = readProtocolClassificationJsonDocument(jsonFilePath)
  writeFileSync(csvFilePath, protocolClassificationToCsv(doc), "utf8")
}
