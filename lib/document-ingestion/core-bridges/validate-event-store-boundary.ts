/**
 * Document Engine v1 — validate rows against Action Center `cliniq_action_items` contract (no persistence).
 *
 * Contract: ActionItemRow (`lib/cliniq-core/action-center/persistence-types.ts`).
 * Document-engine traceability: `metadata.documentEngine` from `toEventStoreBoundaryInput`.
 */

const ALLOWED_PRIORITY = new Set(["high", "medium", "low"])
const ALLOWED_STATUS = new Set(["open", "in_progress", "blocked", "resolved"])
/** Matches {@link ActionOwnerRole} in action-center/types — rows from document adapter use `manual_review`. */
const ALLOWED_OWNER_ROLE = new Set([
  "billing",
  "coordinator",
  "site_manager",
  "finance",
  "operations",
  "manual_review",
])
const DOCUMENT_ENGINE_ACTION_TYPE = "revenue_review_action"

export type ValidateEventStoreBoundaryError = {
  index: number
  reasons: string[]
}

export type ValidateEventStoreBoundaryResult = {
  validRows: number
  invalidRows: number
  errors: ValidateEventStoreBoundaryError[]
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x)
}

function reqString(row: Record<string, unknown>, key: string, reasons: string[]): string | null {
  const v = row[key]
  if (typeof v !== "string") {
    reasons.push(`missing or non-string field: ${key}`)
    return null
  }
  if (v.length === 0) {
    reasons.push(`empty string field: ${key}`)
    return null
  }
  return v
}

function reqNumber(row: Record<string, unknown>, key: string, reasons: string[]): void {
  const v = row[key]
  if (typeof v !== "number" || !Number.isFinite(v)) {
    reasons.push(`missing or non-finite number field: ${key}`)
  }
}

function nullableString(row: Record<string, unknown>, key: string, reasons: string[]): void {
  const v = row[key]
  if (v !== null && typeof v !== "string") {
    reasons.push(`field ${key} must be string or null`)
  }
}

function validateTraceability(metadata: unknown, reasons: string[]): void {
  if (!isRecord(metadata)) {
    reasons.push("metadata must be a plain object")
    return
  }
  const de = metadata.documentEngine
  if (!isRecord(de)) {
    reasons.push("metadata.documentEngine must be a plain object")
    return
  }
  if (!("sourceDocumentId" in de)) {
    reasons.push("traceability: sourceDocumentId key missing")
  } else {
    const sd = de.sourceDocumentId
    if (sd !== null && typeof sd !== "string") {
      reasons.push("traceability: sourceDocumentId must be string or null")
    }
  }
  const sa = de.sourceActionId
  if (typeof sa !== "string" || sa.length === 0) {
    reasons.push("traceability: sourceActionId must be a non-empty string")
  }
  const sdraft = de.sourceDraftEventId
  if (typeof sdraft !== "string" || sdraft.length === 0) {
    reasons.push("traceability: sourceDraftEventId must be a non-empty string")
  }
}

function validateOneRow(row: unknown): string[] {
  const reasons: string[] = []
  if (!isRecord(row)) {
    return ["row must be a plain object"]
  }

  reqString(row, "id", reasons)
  reqString(row, "study_id", reasons)
  nullableString(row, "sponsor_id", reasons)
  reqString(row, "subject_id", reasons)
  reqString(row, "visit_name", reasons)
  reqString(row, "line_code", reasons)

  const actionType = reqString(row, "action_type", reasons)
  if (actionType !== null && actionType !== DOCUMENT_ENGINE_ACTION_TYPE) {
    reasons.push(`action_type must be "${DOCUMENT_ENGINE_ACTION_TYPE}" for document-engine boundary rows`)
  }

  const owner = reqString(row, "owner_role", reasons)
  if (owner !== null && !ALLOWED_OWNER_ROLE.has(owner)) {
    reasons.push(`owner_role must be one of: ${[...ALLOWED_OWNER_ROLE].sort().join(", ")}`)
  }

  const pr = row.priority
  if (typeof pr !== "string" || !ALLOWED_PRIORITY.has(pr)) {
    reasons.push(`priority must be one of: ${[...ALLOWED_PRIORITY].join(", ")}`)
  }

  const st = row.status
  if (typeof st !== "string" || !ALLOWED_STATUS.has(st)) {
    reasons.push(`status must be one of: ${[...ALLOWED_STATUS].join(", ")}`)
  }

  reqString(row, "title", reasons)
  reqString(row, "description", reasons)

  reqNumber(row, "expected_amount", reasons)
  reqNumber(row, "invoiced_amount", reasons)
  reqNumber(row, "missing_amount", reasons)

  reqString(row, "leakage_status", reasons)
  reqString(row, "leakage_reason", reasons)

  nullableString(row, "event_log_id", reasons)
  nullableString(row, "billable_instance_id", reasons)
  nullableString(row, "invoice_period_start", reasons)
  nullableString(row, "invoice_period_end", reasons)
  nullableString(row, "source_hash", reasons)

  validateTraceability(row.metadata, reasons)

  reqString(row, "created_at", reasons)
  reqString(row, "updated_at", reasons)
  const ra = row.resolved_at
  if (ra !== null && typeof ra !== "string") {
    reasons.push("resolved_at must be string or null")
  }

  return reasons
}

/**
 * Validates each row against {@link ActionItemRow} and document-engine traceability under `metadata.documentEngine`.
 * Does not throw, mutate, or filter.
 */
export function validateEventStoreBoundary(input: {
  rows: any[]
}): ValidateEventStoreBoundaryResult {
  const errors: ValidateEventStoreBoundaryError[] = []
  let validRows = 0
  let invalidRows = 0

  for (let i = 0; i < input.rows.length; i++) {
    const reasons = validateOneRow(input.rows[i])
    if (reasons.length === 0) {
      validRows += 1
    } else {
      invalidRows += 1
      errors.push({ index: i, reasons })
    }
  }

  return { validRows, invalidRows, errors }
}
