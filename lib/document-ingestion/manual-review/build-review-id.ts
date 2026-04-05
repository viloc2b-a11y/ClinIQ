export function buildReviewId(params: {
  fileName?: string
  sourceType: "excel" | "pdf" | "word" | "unknown"
  acceptanceStatus:
    | "accepted"
    | "accepted_with_warnings"
    | "manual_review_required"
    | "rejected"
}) {
  const safeFile = (params.fileName || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return `review-${params.sourceType}-${params.acceptanceStatus}-${safeFile || "unknown"}`
}
