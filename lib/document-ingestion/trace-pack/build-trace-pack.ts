import type { InternalScenarioKey } from "../scenarios/types"
import { countTraceArtifacts } from "./count-trace-artifacts"
import { evaluateTracePackStatus } from "./evaluate-trace-pack-status"

export function buildTracePack(params: {
  scenarioRun: {
    data: {
      scenario: {
        key: string
        label: string
        fixtureType: string
      } | null
      fixture: {
        fileName: string
      } | null
      result: {
        data?: {
          runnerResult?: {
            summary?: {
              status?: "ready" | "partial" | "blocked"
              sourceType?: "excel" | "pdf" | "word" | "unknown"
              route?: "excel_hardened" | "legacy" | "unknown"
              documentReady?: boolean
              actionCenterReady?: boolean
              postPersistenceReady?: boolean
              revenueReady?: boolean
              outputsReady?: boolean
            }
            data?: {
              pipeline?: {
                summary?: {
                  bridgeStatus?: unknown
                  orchestrationStatus?: unknown
                  actionCenterStatus?: unknown
                  postPersistenceStatus?: unknown
                  revenueStatus?: unknown
                }
              }
              outputs?: {
                report?: unknown | null
                executiveSummary?: unknown | null
                email?: unknown | null
                pdfPayload?: unknown | null
                htmlReport?: unknown | null
                dashboardCards?: unknown | null
                sendReportPayload?: unknown | null
                demoSurface?: unknown | null
              }
            }
          }
        }
      } | null
    }
    summary: {
      found: boolean
      key?: string
    }
    warnings: Array<{
      code: string
      message: string
      severity: "info" | "warning" | "error"
    }>
  }
}) {
  const scenario = params.scenarioRun.data.scenario
  const fixture = params.scenarioRun.data.fixture
  const runnerResult = params.scenarioRun.data.result?.data?.runnerResult

  const runnerSummary = runnerResult?.summary || {}
  const pipelineSummary = runnerResult?.data?.pipeline?.summary || {}
  const outputs = runnerResult?.data?.outputs || null

  const artifactState = countTraceArtifacts({
    outputs,
  })

  const status = evaluateTracePackStatus({
    found: params.scenarioRun.summary.found,
    documentReady: runnerSummary.documentReady === true,
    actionCenterReady: runnerSummary.actionCenterReady === true,
    postPersistenceReady: runnerSummary.postPersistenceReady === true,
    revenueReady: runnerSummary.revenueReady === true,
    outputsReady: runnerSummary.outputsReady === true,
  })

  const scenarioKey = scenario?.key != null ? (scenario.key as InternalScenarioKey) : null

  return {
    data: {
      scenario:
        scenario != null
          ? {
              key: scenario.key as InternalScenarioKey,
              label: scenario.label,
              fixtureType: scenario.fixtureType,
              fileName: fixture?.fileName || null,
            }
          : null,
      trace:
        scenario != null
          ? {
              source: {
                sourceType: runnerSummary.sourceType || "unknown",
                route: runnerSummary.route || "unknown",
              },
              readiness: {
                status: status.data.status,
                documentReady: runnerSummary.documentReady === true,
                actionCenterReady: runnerSummary.actionCenterReady === true,
                postPersistenceReady: runnerSummary.postPersistenceReady === true,
                revenueReady: runnerSummary.revenueReady === true,
                outputsReady: runnerSummary.outputsReady === true,
              },
              pipelineSnapshot: {
                bridgeStatus: pipelineSummary.bridgeStatus ?? null,
                orchestrationStatus: pipelineSummary.orchestrationStatus ?? null,
                actionCenterStatus: pipelineSummary.actionCenterStatus ?? null,
                postPersistenceStatus: pipelineSummary.postPersistenceStatus ?? null,
                revenueStatus: pipelineSummary.revenueStatus ?? null,
              },
              outputsSnapshot: {
                artifactsReady: artifactState.data.artifactsReady,
                reportReady: artifactState.data.reportReady,
                executiveSummaryReady: artifactState.data.executiveSummaryReady,
                emailReady: artifactState.data.emailReady,
                pdfPayloadReady: artifactState.data.pdfPayloadReady,
                htmlReportReady: artifactState.data.htmlReportReady,
                dashboardCardsReady: artifactState.data.dashboardCardsReady,
                sendReportPayloadReady: artifactState.data.sendReportPayloadReady,
                demoSurfaceReady: artifactState.data.demoSurfaceReady,
              },
              warningsSnapshot: params.scenarioRun.warnings.slice(0, 10),
            }
          : null,
    },
    summary: {
      status: status.data.status,
      found: params.scenarioRun.summary.found,
      key: scenarioKey,
      artifactsReady: artifactState.data.artifactsReady,
      totalWarnings: params.scenarioRun.warnings.length,
    },
    warnings: [...artifactState.warnings, ...status.warnings],
  }
}
