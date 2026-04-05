export type AdapterDocumentIntent =
  | "soa"
  | "budget"
  | "contract"
  | "unknown"

export type AdapterMatchConfidence = "high" | "medium" | "low"

export type AdapterCandidate = {
  adapterId: string
  intent: AdapterDocumentIntent
  confidence: AdapterMatchConfidence
  reason: string
}

export type AdaptedCanonicalRecord = {
  recordType:
    | "soa_activity"
    | "budget_line"
    | "contract_clause"
    | "invoice_line"
    | "visit_schedule"
  fields: Record<string, unknown>
  trace?: {
    adapterId: string
    sourceType: "excel" | "pdf" | "word" | "unknown"
    fileName?: string
    sheetName?: string
    pageNumber?: number
    rowIndex?: number
    rawTextSnippet?: string
  }
}

export type AdapterRunResult = {
  data: {
    adapter: AdapterCandidate | null
    records: AdaptedCanonicalRecord[]
    fallbackUsed: boolean
  }
  summary: {
    intent: AdapterDocumentIntent
    adapterId: string | null
    totalRecords: number
    fallbackUsed: boolean
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
