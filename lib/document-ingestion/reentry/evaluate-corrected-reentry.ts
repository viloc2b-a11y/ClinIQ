import type { ReentryDecision, ReentryDecisionStatus } from "./types"
import { countCorrectedMissingFields } from "./count-corrected-missing-fields"
import { countHumanReviewedFields } from "./count-human-reviewed-fields"

export function evaluateCorrectedReentry(params: {
  correctedParse: {
    data: {
      records: Array<{
        recordType: "soa_activity" | "budget_line" | "contract_clause" | "invoice_line" | "visit_schedule"
        fields: Record<string, unknown>
      }>
      appliedCorrections: Array<{
        applied: boolean
      }>
    }
    summary: {
      sourceType: "excel" | "pdf" | "word" | "unknown"
      totalRecords: number
      appliedCount: number
    }
  } | null
}): ReentryDecision {
  const reasons: ReentryDecision["data"]["reasons"] = []

  if (!params.correctedParse) {
    reasons.push({
      code: "missing_corrected_parse",
      message: "No corrected parse available for re-entry evaluation",
      severity: "error",
    })

    return {
      data: {
        status: "rejected",
        canReenter: false,
        reasons,
      },
      summary: {
        status: "rejected",
        canReenter: false,
        totalReasons: reasons.length,
      },
      warnings: reasons,
    }
  }

  const records = params.correctedParse.data.records
  const appliedCount = params.correctedParse.summary.appliedCount

  if (records.length === 0) {
    reasons.push({
      code: "no_corrected_records",
      message: "Corrected parse contains no records",
      severity: "error",
    })
  }

  const missing = countCorrectedMissingFields({ records })
  const reviewed = countHumanReviewedFields({ records })

  const missingRate =
    missing.totalChecked === 0 ? 1 : missing.missingCount / missing.totalChecked

  if (missing.missingCount > 0) {
    reasons.push({
      code: "corrected_missing_fields",
      message: `Corrected parse still has missing required fields (${missing.missingCount}/${missing.totalChecked})`,
      severity: missingRate > 0.2 ? "error" : "warning",
    })
  }

  if (appliedCount === 0) {
    reasons.push({
      code: "no_applied_corrections",
      message: "No approved corrections were applied",
      severity: "warning",
    })
  }

  if (reviewed.humanReviewedFields === 0 && appliedCount > 0) {
    reasons.push({
      code: "missing_human_review_markers",
      message: "Applied corrections did not preserve human-reviewed markers",
      severity: "error",
    })
  }

  let status: ReentryDecisionStatus = "accepted"

  const hasError = reasons.some((r) => r.severity === "error")
  const hasWarning = reasons.some((r) => r.severity === "warning")

  if (records.length === 0) {
    status = "rejected"
  } else if (hasError) {
    status = "manual_review_required"
  } else if (hasWarning) {
    status = "accepted_with_warnings"
  } else {
    reasons.push({
      code: "reentry_passed",
      message: "Corrected parse passed re-entry gate",
      severity: "info",
    })
    status = "accepted"
  }

  return {
    data: {
      status,
      canReenter: status === "accepted" || status === "accepted_with_warnings",
      reasons,
    },
    summary: {
      status,
      canReenter: status === "accepted" || status === "accepted_with_warnings",
      totalReasons: reasons.length,
    },
    warnings: reasons.filter((r) => r.severity !== "info"),
  }
}
