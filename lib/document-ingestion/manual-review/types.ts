export type ManualReviewPriority = "high" | "medium" | "low"

export type ManualReviewFieldIssue = {
  fieldName: string
  issueType:
    | "missing"
    | "low_confidence"
    | "ambiguous"
    | "adapter_fallback"
    | "critical_warning"
  message: string
  trace?: {
    sourceType?: "excel" | "pdf" | "word" | "unknown"
    fileName?: string
    sheetName?: string
    pageNumber?: number
    rowIndex?: number
    rawTextSnippet?: string
  }
}

export type ManualReviewItem = {
  reviewId: string
  sourceType: "excel" | "pdf" | "word" | "unknown"
  fileName: string | null
  acceptanceStatus:
    | "accepted"
    | "accepted_with_warnings"
    | "manual_review_required"
    | "rejected"
  priority: ManualReviewPriority
  adapterId: string | null
  fallbackUsed: boolean
  totalRecords: number
  reasons: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
  fieldIssues: ManualReviewFieldIssue[]
}

export type ManualReviewQueueEntry = {
  queueItemId: string
  reviewId: string
  status: "pending"
  priority: ManualReviewPriority
  fileName: string | null
  sourceType: "excel" | "pdf" | "word" | "unknown"
  acceptanceStatus: "manual_review_required" | "rejected"
}

export type ManualReviewPayload = {
  data: {
    reviewItem: ManualReviewItem | null
    queueEntry: ManualReviewQueueEntry | null
    shouldQueue: boolean
  }
  summary: {
    shouldQueue: boolean
    priority: ManualReviewPriority | null
    acceptanceStatus:
      | "accepted"
      | "accepted_with_warnings"
      | "manual_review_required"
      | "rejected"
    totalFieldIssues: number
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
