import type { ManualReviewItem } from "./types"
import { buildReviewId } from "./build-review-id"
import { deriveReviewPriority } from "./derive-review-priority"
import { extractFieldIssues } from "./extract-field-issues"

export function buildManualReviewItem(params: {
  fileName?: string
  sourceType: "excel" | "pdf" | "word" | "unknown"
  adapted: {
    summary: {
      adapterId: string | null
      totalRecords: number
      fallbackUsed: boolean
    }
    data: {
      records: Array<{
        recordType: string
        fields: Record<string, unknown>
        trace?: {
          sourceType?: "excel" | "pdf" | "word" | "unknown"
          fileName?: string
          sheetName?: string
          pageNumber?: number
          rowIndex?: number
          rawTextSnippet?: string
        }
      }>
    }
    warnings: Array<{
      code: string
      message: string
      severity: "info" | "warning" | "error"
    }>
  }
  qualityGate: {
    data: {
      status:
        | "accepted"
        | "accepted_with_warnings"
        | "manual_review_required"
        | "rejected"
      reasons: Array<{
        code: string
        message: string
        severity: "info" | "warning" | "error"
      }>
    }
  }
}): ManualReviewItem {
  const reviewId = buildReviewId({
    fileName: params.fileName,
    sourceType: params.sourceType,
    acceptanceStatus: params.qualityGate.data.status,
  })

  const fieldIssues = extractFieldIssues({
    adapted: params.adapted,
    qualityGate: params.qualityGate,
  })

  const priority =
    params.qualityGate.data.status === "manual_review_required" ||
    params.qualityGate.data.status === "rejected"
      ? deriveReviewPriority({
          acceptanceStatus: params.qualityGate.data.status,
          reasons: params.qualityGate.data.reasons,
          totalRecords: params.adapted.summary.totalRecords,
          fallbackUsed: params.adapted.summary.fallbackUsed,
        })
      : "low"

  return {
    reviewId,
    sourceType: params.sourceType,
    fileName: params.fileName ?? null,
    acceptanceStatus: params.qualityGate.data.status,
    priority,
    adapterId: params.adapted.summary.adapterId,
    fallbackUsed: params.adapted.summary.fallbackUsed,
    totalRecords: params.adapted.summary.totalRecords,
    reasons: params.qualityGate.data.reasons,
    fieldIssues,
  }
}
