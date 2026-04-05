export type HumanResolutionDecision = "approve" | "reject" | "skip"

export type HumanFieldCorrection = {
  recordIndex: number
  recordType: "soa_activity" | "budget_line" | "contract_clause" | "invoice_line" | "visit_schedule"
  fieldName: string
  originalValue: unknown
  correctedValue: unknown
  decision: HumanResolutionDecision
  reviewerNote?: string
}

export type HumanResolutionPayload = {
  reviewId: string
  fileName: string | null
  sourceType: "excel" | "pdf" | "word" | "unknown"
  corrections: HumanFieldCorrection[]
}

export type AppliedFieldCorrection = HumanFieldCorrection & {
  applied: boolean
}

export type HumanResolutionResult = {
  data: {
    originalRecords: Array<{
      recordType: "soa_activity" | "budget_line" | "contract_clause" | "invoice_line" | "visit_schedule"
      fields: Record<string, unknown>
      trace?: Record<string, unknown>
    }>
    correctedRecords: Array<{
      recordType: "soa_activity" | "budget_line" | "contract_clause" | "invoice_line" | "visit_schedule"
      fields: Record<string, unknown>
      trace?: Record<string, unknown>
    }>
    appliedCorrections: AppliedFieldCorrection[]
  }
  summary: {
    totalRecords: number
    totalCorrections: number
    appliedCount: number
    rejectedCount: number
    skippedCount: number
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
