export type IntakeWarningCode =
  | "unsupported_file_type"
  | "empty_document"
  | "empty_sheet"
  | "low_text_density"
  | "missing_headers"
  | "unknown_layout"
  | "partial_parse"
  | "ambiguous_visit_name"
  | "ambiguous_fee"
  | "truncated_text"

export type IntakeWarning = {
  code: IntakeWarningCode
  message: string
  severity: "info" | "warning" | "error"
  location?: {
    sheetName?: string
    rowIndex?: number
    columnName?: string
    pageNumber?: number
    section?: string
  }
}

export type SourceTrace = {
  sourceType: "excel" | "pdf" | "word" | "unknown"
  fileName?: string
  sheetName?: string
  pageNumber?: number
  rowIndex?: number
  rawTextSnippet?: string
}

export type ConfidenceLabel = "high" | "medium" | "low"

export type HardenedField<T = unknown> = {
  value: T | null
  confidence: ConfidenceLabel
  trace?: SourceTrace
}

export type HardenedRecord = {
  recordType:
    | "soa_activity"
    | "budget_line"
    | "invoice_line"
    | "contract_clause"
    | "visit_schedule"
  fields: Record<string, HardenedField>
  trace?: SourceTrace
}

export type HardenedParseResult = {
  data: {
    records: HardenedRecord[]
    rawText?: string
  }
  summary: {
    sourceType: "excel" | "pdf" | "word" | "unknown"
    totalRecords: number
    highConfidenceRecords: number
    mediumConfidenceRecords: number
    lowConfidenceRecords: number
  }
  warnings: IntakeWarning[]
}
