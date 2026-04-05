import type { HumanResolutionResult } from "./types"

export function buildCorrectedParsePayload(params: {
  resolutionResult: HumanResolutionResult
  sourceType: "excel" | "pdf" | "word" | "unknown"
  fileName?: string
}) {
  return {
    data: {
      sourceType: params.sourceType,
      fileName: params.fileName ?? null,
      records: params.resolutionResult.data.correctedRecords,
      appliedCorrections: params.resolutionResult.data.appliedCorrections,
    },
    summary: {
      sourceType: params.sourceType,
      totalRecords: params.resolutionResult.summary.totalRecords,
      appliedCount: params.resolutionResult.summary.appliedCount,
    },
    warnings: [] as Array<{
      code: string
      message: string
      severity: "info" | "warning" | "error"
    }>,
  }
}
