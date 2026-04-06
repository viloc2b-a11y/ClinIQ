export function formatTracePackText(params: {
  tracePack: {
    data: {
      scenario: {
        key: string
        label: string
        fixtureType: string
        fileName: string | null
      } | null
      trace: {
        source: {
          sourceType: string
          route: string
        }
        readiness: {
          status: string
          documentReady: boolean
          actionCenterReady: boolean
          postPersistenceReady: boolean
          revenueReady: boolean
          outputsReady: boolean
        }
        pipelineSnapshot: {
          bridgeStatus: unknown
          orchestrationStatus: unknown
          actionCenterStatus: unknown
          postPersistenceStatus: unknown
          revenueStatus: unknown
        }
        outputsSnapshot: {
          artifactsReady: number
        }
        warningsSnapshot: Array<{
          code: string
          message: string
          severity: string
        }>
      } | null
    }
  }
}) {
  const scenario = params.tracePack.data.scenario
  const trace = params.tracePack.data.trace

  const lines: string[] = []

  lines.push(`ClinIQ trace pack: ${scenario?.key || "unknown"}`)
  lines.push(`Label: ${scenario?.label || "unknown"}`)
  lines.push(`File: ${scenario?.fileName || "unknown"}`)
  lines.push("")

  if (!trace) {
    lines.push("Trace: unavailable")
  } else {
    lines.push(`Source Type: ${trace.source.sourceType}`)
    lines.push(`Route: ${trace.source.route}`)
    lines.push(`Status: ${trace.readiness.status}`)
    lines.push(`Artifacts Ready: ${trace.outputsSnapshot.artifactsReady}`)
    lines.push("")
    lines.push("Pipeline:")
    lines.push(`- Bridge: ${String(trace.pipelineSnapshot.bridgeStatus)}`)
    lines.push(`- Orchestration: ${String(trace.pipelineSnapshot.orchestrationStatus)}`)
    lines.push(`- Action Center: ${String(trace.pipelineSnapshot.actionCenterStatus)}`)
    lines.push(`- Post-Persistence: ${String(trace.pipelineSnapshot.postPersistenceStatus)}`)
    lines.push(`- Revenue: ${String(trace.pipelineSnapshot.revenueStatus)}`)
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
