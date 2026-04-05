import type { ManualReviewQueueEntry } from "./types"
import { buildQueueItemId } from "./build-queue-item-id"

export function buildManualReviewQueueEntry(params: {
  reviewItem: {
    reviewId: string
    priority: "high" | "medium" | "low"
    fileName: string | null
    sourceType: "excel" | "pdf" | "word" | "unknown"
    acceptanceStatus:
      | "accepted"
      | "accepted_with_warnings"
      | "manual_review_required"
      | "rejected"
  }
}): ManualReviewQueueEntry | null {
  if (
    params.reviewItem.acceptanceStatus !== "manual_review_required" &&
    params.reviewItem.acceptanceStatus !== "rejected"
  ) {
    return null
  }

  return {
    queueItemId: buildQueueItemId(params.reviewItem.reviewId),
    reviewId: params.reviewItem.reviewId,
    status: "pending",
    priority: params.reviewItem.priority,
    fileName: params.reviewItem.fileName,
    sourceType: params.reviewItem.sourceType,
    acceptanceStatus: params.reviewItem.acceptanceStatus,
  }
}
