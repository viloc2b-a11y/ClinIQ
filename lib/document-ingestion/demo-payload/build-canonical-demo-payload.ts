import { countReadyArtifacts } from "./count-ready-artifacts"
import { evaluateDemoPayloadStatus } from "./evaluate-demo-payload-status"

const DEMO_PAYLOAD_GENERATED_AT_ISO = "2026-04-05T12:00:00.000Z"

export function buildCanonicalDemoPayload(params: {
  runnerResult: {
    data: {
      sourceInput: {
        fileName: string | null
        sourceType: "excel" | "pdf" | "word" | "unknown"
        route: "excel_hardened" | "legacy" | "unknown"
      }
      commercialSurface: {
        storyline: string[]
        statusCards: Array<{
          label: string
          value: string | number | boolean
        }>
        topWarnings: Array<{
          code: string
          message: string
          severity: "info" | "warning" | "error"
        }>
      } | null
      outputs: {
        report: unknown | null
        executiveSummary: unknown | null
        email: unknown | null
        pdfPayload: unknown | null
        htmlReport: unknown | null
        dashboardCards: unknown | null
        sendReportPayload: unknown | null
        demoSurface: unknown | null
      }
    }
    summary: {
      status: "ready" | "partial" | "blocked"
      sourceType: "excel" | "pdf" | "word" | "unknown"
      route: "excel_hardened" | "legacy" | "unknown"
      documentReady: boolean
      actionCenterReady: boolean
      postPersistenceReady: boolean
      revenueReady: boolean
      outputsReady: boolean
    }
    warnings: Array<{
      code: string
      message: string
      severity: "info" | "warning" | "error"
    }>
  }
}) {
  const artifacts = params.runnerResult.data.outputs

  const artifactCount = countReadyArtifacts({
    artifacts,
  })

  const status = evaluateDemoPayloadStatus({
    sourceType: params.runnerResult.summary.sourceType,
    route: params.runnerResult.summary.route,
    documentReady: params.runnerResult.summary.documentReady,
    actionCenterReady: params.runnerResult.summary.actionCenterReady,
    postPersistenceReady: params.runnerResult.summary.postPersistenceReady,
    revenueReady: params.runnerResult.summary.revenueReady,
    outputsReady: params.runnerResult.summary.outputsReady,
    artifactsReady: artifactCount.data.readyCount,
  })

  const topFromSurface = params.runnerResult.data.commercialSurface?.topWarnings
  const topWarnings =
    topFromSurface && topFromSurface.length > 0
      ? topFromSurface
      : params.runnerResult.warnings.slice(0, 5)

  return {
    data: {
      meta: {
        fileName: params.runnerResult.data.sourceInput.fileName,
        sourceType: params.runnerResult.summary.sourceType,
        route: params.runnerResult.summary.route,
        generatedAt: DEMO_PAYLOAD_GENERATED_AT_ISO,
        schemaVersion: "1.0" as const,
      },
      readiness: {
        documentReady: params.runnerResult.summary.documentReady,
        actionCenterReady: params.runnerResult.summary.actionCenterReady,
        postPersistenceReady: params.runnerResult.summary.postPersistenceReady,
        revenueReady: params.runnerResult.summary.revenueReady,
        outputsReady: params.runnerResult.summary.outputsReady,
      },
      storyline: params.runnerResult.data.commercialSurface?.storyline || [],
      statusCards: params.runnerResult.data.commercialSurface?.statusCards || [],
      artifacts,
      topWarnings,
    },
    summary: {
      status: status.data.status,
      sourceType: params.runnerResult.summary.sourceType,
      route: params.runnerResult.summary.route,
      artifactsReady: artifactCount.data.readyCount,
      outputsReady: params.runnerResult.summary.outputsReady,
    },
    warnings: [...artifactCount.warnings, ...status.warnings],
  }
}
