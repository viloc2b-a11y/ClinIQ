export type ParseAcceptanceStatus =
  | "accepted"
  | "accepted_with_warnings"
  | "manual_review_required"
  | "rejected"

export type ParseAcceptanceReasonCode =
  | "no_records"
  | "too_many_low_confidence_records"
  | "missing_required_fields"
  | "adapter_fallback_used"
  | "critical_warning_present"
  | "unsupported_source_type"
  | "sufficient_quality"
  | "partial_quality"

export type ParseAcceptanceReason = {
  code: ParseAcceptanceReasonCode
  message: string
  severity: "info" | "warning" | "error"
}

export type QualityGateDecision = {
  data: {
    status: ParseAcceptanceStatus
    accepted: boolean
    manualReviewRequired: boolean
    rejected: boolean
    reasons: ParseAcceptanceReason[]
  }
  summary: {
    status: ParseAcceptanceStatus
    accepted: boolean
    totalReasons: number
  }
  warnings: ParseAcceptanceReason[]
}
