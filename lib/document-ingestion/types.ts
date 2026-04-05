/**
 * Document Engine v1 — canonical parsed-document schema.
 * All format parsers (Excel, PDF, Word) normalize into this shape; no UI or OCR here.
 */

/** Format of the file bytes the parser consumed (`unknown` when orchestrator cannot classify). */
export type DocumentSourceType = "excel" | "pdf" | "word" | "unknown"

/**
 * Per-field or aggregate trust in structured extraction (deterministic tiers, not ML scores).
 */
export type ParsedFieldConfidence = "high" | "medium" | "low" | "unverified"

/**
 * Optional wrapper when a single column maps ambiguously; prefer plain fields when confidence is implicit high.
 */
export type ParsedField<T> = {
  value: T
  confidence: ParsedFieldConfidence
}

/** Where a row/cell came from (Excel-first; PDF/Word may use page/offset later). */
export type RecordProvenance = {
  sheetName?: string
  /** 1-based row index in the source sheet/table when applicable. */
  rowIndex1Based?: number
  /** Original header labels or cell addresses for audit. */
  columnKeys?: string[]
  /** PDF/Word: 1-based page when known. */
  page1Based?: number
}

/** Base fields shared by every logical record (stable id for merge/dedupe across runs). */
type ParsedRecordBase = {
  /** Parser-produced stable id (e.g. deterministic hash of source coordinates + kind). */
  recordId: string
  provenance?: RecordProvenance
}

/** Schedule of assessments / SOA-style activity row. */
export type SoaActivityRecord = ParsedRecordBase & {
  kind: "soa_activity"
  studyId?: string
  visitName?: string
  visitCode?: string
  activityCode?: string
  activityLabel?: string
  cptCode?: string
  /** ISO 8601 date or period label as read from source. */
  periodLabel?: string
  unit?: string
  quantity?: ParsedField<number | null>
  unitAmount?: ParsedField<number | null>
  currencyCode?: string
}

/** Budget or forecast line (sponsor budget grid). */
export type BudgetLineRecord = ParsedRecordBase & {
  kind: "budget_line"
  studyId?: string
  budgetLineId?: string
  lineCode?: string
  label?: string
  category?: string
  visitName?: string
  unit?: string
  expectedQuantity?: ParsedField<number | null>
  unitPrice?: ParsedField<number | null>
  expectedAmount?: ParsedField<number | null>
  currencyCode?: string
  notes?: string
}

/** Single payable line from an invoice. */
export type InvoiceLineRecord = ParsedRecordBase & {
  kind: "invoice_line"
  invoiceNumber?: string
  studyId?: string
  sponsorName?: string
  lineCode?: string
  description?: string
  servicePeriodStart?: string
  servicePeriodEnd?: string
  quantity?: ParsedField<number | null>
  unitPrice?: ParsedField<number | null>
  lineAmount?: ParsedField<number | null>
  currencyCode?: string
  taxAmount?: ParsedField<number | null>
}

/** Extracted contractual obligation or defined term (clause-level, not full doc). */
export type ContractClauseRecord = ParsedRecordBase & {
  kind: "contract_clause"
  studyId?: string
  clauseType:
    | "payment_terms"
    | "invoice_timing"
    | "indemnification"
    | "publication"
    | "governing_law"
    | "other"
  sectionReference?: string
  title?: string
  /** Verbatim or normalized excerpt; keep bounded in parsers. */
  excerpt: string
  booleanValue?: ParsedField<boolean | null>
}

/** Visit window / schedule entry from protocol or visit grid. */
export type VisitScheduleRecord = ParsedRecordBase & {
  kind: "visit_schedule"
  studyId?: string
  visitName?: string
  visitNumber?: ParsedField<number | null>
  visitCode?: string
  windowLabel?: string
  targetStudyDay?: ParsedField<number | null>
  windowStartDay?: ParsedField<number | null>
  windowEndDay?: ParsedField<number | null>
  procedureLabels?: string[]
  notes?: string
}

/**
 * One normalized row after parsing — discriminated by `kind` for exhaustiveness in downstream code.
 */
export type ParsedDocumentRecord =
  | SoaActivityRecord
  | BudgetLineRecord
  | InvoiceLineRecord
  | ContractClauseRecord
  | VisitScheduleRecord

export const PARSED_DOCUMENT_SCHEMA_VERSION = "1" as const

/**
 * Top-level artifact from a single file parse: metadata + homogeneous record list.
 */
export type ParsedDocument = {
  schemaVersion: typeof PARSED_DOCUMENT_SCHEMA_VERSION
  sourceType: DocumentSourceType
  /** Logical document role inferred by router/intake (not file extension). */
  documentRole?: "soa" | "budget" | "invoice" | "contract" | "protocol_schedule" | "unknown"
  fileName?: string
  /** Original MIME type from intake, when provided (orchestrator). */
  mimeType?: string
  /** From {@link classifyDocument} at orchestration time. */
  classificationConfidence?: number
  /** ISO 8601 timestamp when parsing completed. */
  parsedAt: string
  /** Identifier of the parser implementation (e.g. `cliniq-excel-budget-v1`). */
  parserId: string
  records: ParsedDocumentRecord[]
  /** Non-fatal issues (empty sheet, defaulted headers, etc.). */
  warnings: string[]
}
