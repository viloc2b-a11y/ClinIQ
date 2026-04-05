import type { AppliedFieldCorrection, HumanResolutionPayload, HumanResolutionResult } from "./types"

export function applyHumanCorrections(params: {
  payload: HumanResolutionPayload
  adaptedRecords: Array<{
    recordType: "soa_activity" | "budget_line" | "contract_clause" | "invoice_line" | "visit_schedule"
    fields: Record<string, unknown>
    trace?: Record<string, unknown>
  }>
}): HumanResolutionResult {
  const correctedRecords = params.adaptedRecords.map((record) => ({
    recordType: record.recordType,
    fields: { ...record.fields },
    trace: record.trace ? { ...record.trace } : undefined,
  }))

  const appliedCorrections: AppliedFieldCorrection[] = []

  for (const correction of params.payload.corrections) {
    const target = correctedRecords[correction.recordIndex]

    if (!target) {
      appliedCorrections.push({
        ...correction,
        applied: false,
      })
      continue
    }

    if (correction.decision !== "approve") {
      appliedCorrections.push({
        ...correction,
        applied: false,
      })
      continue
    }

    if (!(correction.fieldName in target.fields)) {
      appliedCorrections.push({
        ...correction,
        applied: false,
      })
      continue
    }

    const currentField = target.fields[correction.fieldName]

    if (
      currentField &&
      typeof currentField === "object" &&
      "value" in (currentField as Record<string, unknown>)
    ) {
      target.fields[correction.fieldName] = {
        ...(currentField as Record<string, unknown>),
        value: correction.correctedValue,
        confidence: "high",
        humanReviewed: true,
        originalValue: correction.originalValue,
        reviewerNote: correction.reviewerNote ?? null,
      }
    } else {
      target.fields[correction.fieldName] = {
        value: correction.correctedValue,
        confidence: "high",
        humanReviewed: true,
        originalValue: correction.originalValue,
        reviewerNote: correction.reviewerNote ?? null,
      }
    }

    appliedCorrections.push({
      ...correction,
      applied: true,
    })
  }

  const appliedCount = appliedCorrections.filter((c) => c.applied).length
  const rejectedCount = appliedCorrections.filter((c) => c.decision === "reject").length
  const skippedCount = appliedCorrections.filter((c) => c.decision === "skip").length

  return {
    data: {
      originalRecords: params.adaptedRecords,
      correctedRecords,
      appliedCorrections,
    },
    summary: {
      totalRecords: params.adaptedRecords.length,
      totalCorrections: appliedCorrections.length,
      appliedCount,
      rejectedCount,
      skippedCount,
    },
    warnings: [],
  }
}
