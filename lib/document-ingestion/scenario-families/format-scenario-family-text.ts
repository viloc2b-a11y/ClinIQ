import type { ScenarioFamilyResult } from "./types"

export function formatScenarioFamilyText(params: { result: ScenarioFamilyResult }) {
  const lines: string[] = []

  lines.push("ClinIQ scenario families")
  lines.push("")
  lines.push(
    `Totals: ${params.result.summary.totalFamilies} families | scenarios=${params.result.summary.totalScenarios} | ready=${params.result.summary.readyCount} partial=${params.result.summary.partialCount} blocked=${params.result.summary.blockedCount}`,
  )
  lines.push("")
  lines.push("Families:")

  for (const family of params.result.data.families) {
    lines.push(
      `- ${family.key} | total=${family.totalScenarios} | ready=${family.readyCount} | partial=${family.partialCount} | blocked=${family.blockedCount} | outputsReady=${family.outputsReadyCount}`,
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
