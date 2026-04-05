import type { ManualReviewPayload } from "./types"
import { buildManualReviewItem } from "./build-manual-review-item"
import { buildManualReviewQueueEntry } from "./build-manual-review-queue-entry"

export function buildManualReviewPayload(params: {
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
}): ManualReviewPayload {
  const reviewItem = buildManualReviewItem(params)
  const queueEntry = buildManualReviewQueueEntry({ reviewItem })

  return {
    data: {
      reviewItem,
      queueEntry,
      shouldQueue: !!queueEntry,
    },
    summary: {
      shouldQueue: !!queueEntry,
      priority: queueEntry ? queueEntry.priority : null,
      acceptanceStatus: reviewItem.acceptanceStatus,
      totalFieldIssues: reviewItem.fieldIssues.length,
    },
    warnings: reviewItem.reasons,
  }
}
