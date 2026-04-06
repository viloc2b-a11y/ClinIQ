import type { InternalScenarioKey } from "../scenarios/types"

export type InternalTracePackStatus = "ready" | "partial" | "blocked"

export type InternalTracePack = {
  data: {
    scenario: {
      key: InternalScenarioKey
      label: string
      fixtureType: string
      fileName: string | null
    } | null
    trace: {
      source: {
        sourceType: "excel" | "pdf" | "word" | "unknown"
        route: "excel_hardened" | "legacy" | "unknown"
      }
      readiness: {
        status: InternalTracePackStatus
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
        reportReady: boolean
        executiveSummaryReady: boolean
        emailReady: boolean
        pdfPayloadReady: boolean
        htmlReportReady: boolean
        dashboardCardsReady: boolean
        sendReportPayloadReady: boolean
        demoSurfaceReady: boolean
      }
      warningsSnapshot: Array<{
        code: string
        message: string
        severity: "info" | "warning" | "error"
      }>
    } | null
  }
  summary: {
    status: InternalTracePackStatus
    found: boolean
    key: InternalScenarioKey | null
    artifactsReady: number
    totalWarnings: number
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
