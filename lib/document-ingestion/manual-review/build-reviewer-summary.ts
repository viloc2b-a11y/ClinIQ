export function buildReviewerSummary(params: {
  reviewPayload: {
    data: {
      reviewItem: {
        reviewId: string
        fileName: string | null
        sourceType: "excel" | "pdf" | "word" | "unknown"
        acceptanceStatus:
          | "accepted"
          | "accepted_with_warnings"
          | "manual_review_required"
          | "rejected"
        priority: "high" | "medium" | "low"
        adapterId: string | null
        fallbackUsed: boolean
        totalRecords: number
        reasons: Array<{
          code: string
          message: string
          severity: "info" | "warning" | "error"
        }>
        fieldIssues: Array<{
          fieldName: string
          issueType:
            | "missing"
            | "low_confidence"
            | "ambiguous"
            | "adapter_fallback"
            | "critical_warning"
          message: string
        }>
      } | null
    }
  }
}) {
  const item = params.reviewPayload.data.reviewItem

  if (!item) {
    return {
      data: {
        lines: ["No review item generated."],
      },
      summary: {
        lineCount: 1,
      },
      warnings: [] as Array<{
        code: string
        message: string
        severity: "info" | "warning" | "error"
      }>,
    }
  }

  const lines = [
    `Review ID: ${item.reviewId}`,
    `File: ${item.fileName || "unknown"}`,
    `Source Type: ${item.sourceType}`,
    `Acceptance Status: ${item.acceptanceStatus}`,
    `Priority: ${item.priority}`,
    `Adapter: ${item.adapterId || "none"}`,
    `Fallback Used: ${item.fallbackUsed ? "yes" : "no"}`,
    `Total Records: ${item.totalRecords}`,
    `Top Reasons: ${item.reasons.slice(0, 3).map((r) => r.message).join(" | ") || "none"}`,
    `Top Field Issues: ${item.fieldIssues.slice(0, 5).map((f) => `${f.fieldName}:${f.issueType}`).join(" | ") || "none"}`,
  ]

  return {
    data: {
      lines,
    },
    summary: {
      lineCount: lines.length,
    },
    warnings: item.reasons,
  }
}
