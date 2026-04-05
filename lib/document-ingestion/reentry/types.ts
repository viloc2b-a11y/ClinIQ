export type ReentryDecisionStatus =
  | "accepted"
  | "accepted_with_warnings"
  | "manual_review_required"
  | "rejected"

export type ReentryDecision = {
  data: {
    status: ReentryDecisionStatus
    canReenter: boolean
    reasons: Array<{
      code: string
      message: string
      severity: "info" | "warning" | "error"
    }>
  }
  summary: {
    status: ReentryDecisionStatus
    canReenter: boolean
    totalReasons: number
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
