import type { ScenarioCatalogResult } from "./types"

export function formatScenarioCatalogText(params: { catalog: ScenarioCatalogResult }) {
  const lines: string[] = []

  lines.push("ClinIQ scenario catalog")
  lines.push("")

  lines.push(
    `Totals: ${params.catalog.summary.totalEntries} entries | ready=${params.catalog.summary.readyCount} partial=${params.catalog.summary.partialCount} blocked=${params.catalog.summary.blockedCount}`,
  )
  lines.push(
    `Outputs ready: ${params.catalog.summary.outputsReadyCount}/${params.catalog.summary.totalEntries}`,
  )
  lines.push("")

  lines.push("Entries:")
  for (const entry of params.catalog.data.entries) {
    lines.push(
      `- ${entry.key} | ${entry.fixtureType} | status=${entry.status} | route=${entry.route} | outputsReady=${String(entry.outputsReady)} | artifacts=${entry.artifactsReady} | warnings=${entry.totalWarnings}`,
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
