export function buildHumanResolutionSummary(params: {
  mergeResult: {
    summary: {
      valid: boolean
      appliedCount: number
    }
    data: {
      correctedParse: {
        summary: {
          totalRecords: number
        }
      } | null
    }
  }
}) {
  const corrected = params.mergeResult.data.correctedParse

  const lines = [
    `Resolution valid: ${params.mergeResult.summary.valid ? "yes" : "no"}`,
    `Applied corrections: ${params.mergeResult.summary.appliedCount}`,
    `Corrected records: ${corrected?.summary.totalRecords || 0}`,
  ]

  return {
    data: {
      lines,
    },
    summary: {
      lineCount: lines.length,
      appliedCount: params.mergeResult.summary.appliedCount,
    },
    warnings: [] as Array<{
      code: string
      message: string
      severity: "info" | "warning" | "error"
    }>,
  }
}
