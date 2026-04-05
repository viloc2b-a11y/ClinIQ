import type { HumanResolutionPayload } from "./types"
import { validateHumanResolutionPayload } from "./validate-human-resolution-payload"
import { applyHumanCorrections } from "./apply-human-corrections"
import { buildCorrectedParsePayload } from "./build-corrected-parse-payload"

export function runHumanResolutionMerge(params: {
  payload: HumanResolutionPayload
  adaptedRecords: Array<{
    recordType: "soa_activity" | "budget_line" | "contract_clause" | "invoice_line" | "visit_schedule"
    fields: Record<string, unknown>
    trace?: Record<string, unknown>
  }>
}) {
  const validation = validateHumanResolutionPayload({
    payload: params.payload,
    adaptedRecords: params.adaptedRecords,
  })

  if (!validation.data.valid) {
    return {
      data: {
        validation,
        resolutionResult: null,
        correctedParse: null,
      },
      summary: {
        valid: false,
        appliedCount: 0,
      },
      warnings: validation.warnings,
    }
  }

  const resolutionResult = applyHumanCorrections({
    payload: params.payload,
    adaptedRecords: params.adaptedRecords,
  })

  const correctedParse = buildCorrectedParsePayload({
    resolutionResult,
    sourceType: params.payload.sourceType,
    fileName: params.payload.fileName ?? undefined,
  })

  return {
    data: {
      validation,
      resolutionResult,
      correctedParse,
    },
    summary: {
      valid: true,
      appliedCount: resolutionResult.summary.appliedCount,
    },
    warnings: [
      ...validation.warnings,
      ...resolutionResult.warnings,
      ...correctedParse.warnings,
    ],
  }
}
