export function formatConsoleOutput(params: {
  consoleView: {
    headline: string
    status: "ready" | "partial" | "blocked"
    readiness: Array<{
      label: string
      value: string | boolean | number
    }>
    topWarnings: Array<{
      code: string
      message: string
      severity: "info" | "warning" | "error"
    }>
  }
}) {
  const lines: string[] = []

  lines.push(params.consoleView.headline)
  lines.push(`Status: ${params.consoleView.status}`)
  lines.push("")

  lines.push("Readiness:")
  for (const item of params.consoleView.readiness) {
    lines.push(`- ${item.label}: ${String(item.value)}`)
  }

  lines.push("")

  if (params.consoleView.topWarnings.length > 0) {
    lines.push("Warnings:")
    for (const warning of params.consoleView.topWarnings) {
      lines.push(`- [${warning.severity}] ${warning.code}: ${warning.message}`)
    }
  } else {
    lines.push("Warnings:")
    lines.push("- none")
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
