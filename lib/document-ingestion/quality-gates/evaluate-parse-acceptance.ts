import type { ParseAcceptanceReason, QualityGateDecision } from "./types"
import { buildAcceptanceReason } from "./build-acceptance-reason"
import { countMissingRequiredFields } from "./count-missing-required-fields"
import { countLowConfidenceRecords } from "./count-low-confidence-records"

export function evaluateParseAcceptance(params: {
  sourceType: "excel" | "pdf" | "word" | "unknown"
  adapted: {
    summary: {
      totalRecords: number
      fallbackUsed: boolean
    }
    data: {
      records: Array<{
        recordType:
          | "soa_activity"
          | "budget_line"
          | "contract_clause"
          | "invoice_line"
          | "visit_schedule"
        fields: Record<string, unknown>
      }>
    }
    warnings: Array<{
      code: string
      message: string
      severity: "info" | "warning" | "error"
    }>
  }
}): QualityGateDecision {
  const reasons: ParseAcceptanceReason[] = []

  if (params.sourceType === "unknown") {
    reasons.push(
      buildAcceptanceReason({
        code: "unsupported_source_type",
        message: "Unsupported source type for accepted parse",
        severity: "error",
      }),
    )
  }

  if (params.adapted.summary.totalRecords === 0) {
    reasons.push(
      buildAcceptanceReason({
        code: "no_records",
        message: "No canonical records were produced",
        severity: "error",
      }),
    )
  }

  if (params.adapted.summary.fallbackUsed) {
    reasons.push(
      buildAcceptanceReason({
        code: "adapter_fallback_used",
        message: "Targeted adapter was not confidently applied; fallback was used",
        severity: "warning",
      }),
    )
  }

  const missing = countMissingRequiredFields({
    records: params.adapted.data.records,
  })

  const lowConfidence = countLowConfidenceRecords({
    records: params.adapted.data.records,
  })

  const missingRate =
    missing.totalChecked === 0 ? 1 : missing.missingCount / missing.totalChecked

  const lowConfidenceRate =
    lowConfidence.totalRecords === 0
      ? 1
      : lowConfidence.lowConfidenceRecords / lowConfidence.totalRecords

  if (missing.missingCount > 0) {
    reasons.push(
      buildAcceptanceReason({
        code: "missing_required_fields",
        message: `Missing required canonical fields detected (${missing.missingCount}/${missing.totalChecked})`,
        severity: missingRate > 0.35 ? "error" : "warning",
      }),
    )
  }

  if (lowConfidence.lowConfidenceRecords > 0) {
    reasons.push(
      buildAcceptanceReason({
        code: "too_many_low_confidence_records",
        message: `Low-confidence records detected (${lowConfidence.lowConfidenceRecords}/${lowConfidence.totalRecords})`,
        severity: lowConfidenceRate > 0.4 ? "error" : "warning",
      }),
    )
  }

  const criticalWarnings = params.adapted.warnings.filter((w) => w.severity === "error")
  if (criticalWarnings.length > 0) {
    reasons.push(
      buildAcceptanceReason({
        code: "critical_warning_present",
        message: `Critical adapted warnings present (${criticalWarnings.length})`,
        severity: "error",
      }),
    )
  }

  let status: QualityGateDecision["data"]["status"] = "accepted"

  const hasError = reasons.some((r) => r.severity === "error")
  const hasWarning = reasons.some((r) => r.severity === "warning")

  if (params.adapted.summary.totalRecords === 0 || params.sourceType === "unknown") {
    status = "rejected"
  } else if (hasError) {
    status = "manual_review_required"
  } else if (hasWarning) {
    status = "accepted_with_warnings"
  } else {
    status = "accepted"
    reasons.push(
      buildAcceptanceReason({
        code: "sufficient_quality",
        message: "Parse passed quality gates with sufficient quality",
        severity: "info",
      }),
    )
  }

  return {
    data: {
      status,
      accepted: status === "accepted" || status === "accepted_with_warnings",
      manualReviewRequired: status === "manual_review_required",
      rejected: status === "rejected",
      reasons,
    },
    summary: {
      status,
      accepted: status === "accepted" || status === "accepted_with_warnings",
      totalReasons: reasons.length,
    },
    warnings: reasons.filter((r) => r.severity !== "info"),
  }
}
