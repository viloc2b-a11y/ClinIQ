import type { HumanResolutionPayload } from "../human-resolution/types"
import { runBoundDocumentActionFlow } from "../action-center-binding/run-bound-document-action-flow"
import { runPostPersistenceBinding } from "./run-post-persistence-binding"

export function runFullDocumentOperationalChain(params: {
  sourceType: "excel" | "pdf" | "word" | "unknown"
  fileName?: string
  workbook?: Record<string, unknown>
  pdfPages?: Array<{ text?: string | null }>
  wordParagraphs?: string[]
  humanResolutionPayload?: HumanResolutionPayload | null
  persistActionCenterItems?: (payload: {
    items: Array<{
      id: string
      type: string
      title: string
      estimatedValue: number
      sourceTrace?: Record<string, unknown> | null
    }>
  }) => unknown
  verifyPersistedItems?: (params: { expectedIds: string[] }) => {
    found?: number
    missing?: string[]
    matched?: string[]
    totalExpected?: number
  }
  runRecordsStage?: (input: {
    recordsInput: Array<{
      actionItemId: string
      type: string
      title: string
      estimatedValue: number
      sourceTrace?: Record<string, unknown> | null
    }>
  }) => unknown
  runEnvelopesStage?: (recordsResult: unknown) => unknown
  runAuditStage?: (envelopesResult: unknown) => unknown
  runMetricsStage?: (auditResult: unknown) => unknown
  runAdminSnapshotStage?: (metricsResult: unknown) => unknown
  runHealthSnapshotStage?: (metricsResult: unknown) => unknown
}) {
  const actionFlow = runBoundDocumentActionFlow({
    sourceType: params.sourceType,
    fileName: params.fileName,
    workbook: params.workbook,
    pdfPages: params.pdfPages,
    wordParagraphs: params.wordParagraphs,
    humanResolutionPayload: params.humanResolutionPayload,
    persistActionCenterItems: params.persistActionCenterItems,
    verifyPersistedItems: params.verifyPersistedItems,
  })

  const downstreamChain = runPostPersistenceBinding({
    actionFlow,
    runRecordsStage: params.runRecordsStage,
    runEnvelopesStage: params.runEnvelopesStage,
    runAuditStage: params.runAuditStage,
    runMetricsStage: params.runMetricsStage,
    runAdminSnapshotStage: params.runAdminSnapshotStage,
    runHealthSnapshotStage: params.runHealthSnapshotStage,
  })

  return {
    data: {
      actionFlow,
      downstreamChain,
    },
    summary: {
      orchestrationStatus: actionFlow.summary.orchestrationStatus,
      actionCenterStatus: actionFlow.summary.actionCenterStatus,
      postPersistenceStatus: downstreamChain.summary.status,
      totalPersistedItems: downstreamChain.summary.totalPersistedItems,
      recordsReady: downstreamChain.summary.recordsReady,
      envelopesReady: downstreamChain.summary.envelopesReady,
      auditReady: downstreamChain.summary.auditReady,
      metricsReady: downstreamChain.summary.metricsReady,
      snapshotsReady: downstreamChain.summary.snapshotsReady,
    },
    warnings: [...actionFlow.warnings, ...downstreamChain.warnings],
  }
}
