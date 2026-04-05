import type { ReentryDecision } from "./types"

export function buildReentrySummary(params: {
  decision: ReentryDecision
}) {
  const lines = [
    `Re-entry status: ${params.decision.data.status}`,
    `Can re-enter downstream: ${params.decision.data.canReenter ? "yes" : "no"}`,
    `Top reasons: ${params.decision.data.reasons.slice(0, 3).map((r) => r.message).join(" | ") || "none"}`,
  ]

  return {
    data: {
      lines,
    },
    summary: {
      lineCount: lines.length,
      canReenter: params.decision.data.canReenter,
    },
    warnings: params.decision.data.reasons.filter((r) => r.severity !== "info"),
  }
}
