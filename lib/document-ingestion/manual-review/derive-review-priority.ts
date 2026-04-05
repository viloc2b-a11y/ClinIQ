import type { ManualReviewPriority } from "./types"

export function deriveReviewPriority(params: {
  acceptanceStatus: "manual_review_required" | "rejected"
  reasons: Array<{
    code: string
    severity: "info" | "warning" | "error"
  }>
  totalRecords: number
  fallbackUsed: boolean
}): ManualReviewPriority {
  const errorCount = params.reasons.filter((r) => r.severity === "error").length
  const warningCount = params.reasons.filter((r) => r.severity === "warning").length

  if (
    params.acceptanceStatus === "rejected" ||
    errorCount >= 2 ||
    (params.fallbackUsed && params.totalRecords === 0)
  ) {
    return "high"
  }

  if (errorCount >= 1 || warningCount >= 2 || params.fallbackUsed) {
    return "medium"
  }

  return "low"
}
