import type { ScenarioMatrixResult } from "./types"

export function formatScenarioMatrixText(params: { matrix: ScenarioMatrixResult }) {
  const lines: string[] = []

  lines.push("ClinIQ scenario matrix")
  lines.push("")

  lines.push(
    `Totals: ${params.matrix.summary.totalScenarios} scenarios | ready=${params.matrix.summary.readyCount} partial=${params.matrix.summary.partialCount} blocked=${params.matrix.summary.blockedCount}`,
  )
  lines.push(
    `Outputs ready: ${params.matrix.summary.outputsReadyCount}/${params.matrix.summary.totalScenarios}`,
  )
  lines.push("")

  lines.push("Rows:")
  for (const row of params.matrix.data.rows) {
    lines.push(
      `- ${row.key} | status=${row.status} | route=${row.route} | outputsReady=${String(row.outputsReady)} | artifacts=${row.artifactsReady} | warnings=${row.totalWarnings}`,
    )
  }

  return {
    data: {
      text: lines.join("\n"),
    },
    summary: {
      lineCount: lines.length,
    },
    warnings: [] as Array<{ code: string; message: string; severity: "info" | "warning" | "error" }>,
  }
}
