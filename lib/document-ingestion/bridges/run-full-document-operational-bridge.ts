import type { HumanResolutionPayload } from "../human-resolution/types"
import { runFullDocumentOperationalChain } from "../post-persistence-binding/run-full-document-operational-chain"
import { runDocumentOperationalBridge } from "./run-document-operational-bridge"

export function runFullDocumentOperationalBridge(params: {
  fileName?: string
  mimeType?: string | null
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
  const bridge = runDocumentOperationalBridge({
    fileName: params.fileName,
    mimeType: params.mimeType ?? undefined,
    workbook: params.workbook,
    pdfPages: params.pdfPages,
    wordParagraphs: params.wordParagraphs,
  })

  const sourceType = bridge.summary.sourceType
  const useHardenedExcel = sourceType === "excel" && bridge.summary.route === "excel_hardened"

  if (useHardenedExcel) {
    const excelRecords = Array.isArray(bridge.data.bridgeInput.records)
      ? bridge.data.bridgeInput.records
      : []

    const operationalChain = runFullDocumentOperationalChain({
      sourceType: "excel",
      fileName: params.fileName,
      workbook: params.workbook,
      humanResolutionPayload: params.humanResolutionPayload,
      persistActionCenterItems: params.persistActionCenterItems,
      verifyPersistedItems: params.verifyPersistedItems,
      runRecordsStage: params.runRecordsStage,
      runEnvelopesStage: params.runEnvelopesStage,
      runAuditStage: params.runAuditStage,
      runMetricsStage: params.runMetricsStage,
      runAdminSnapshotStage: params.runAdminSnapshotStage,
      runHealthSnapshotStage: params.runHealthSnapshotStage,
    })

    return {
      data: {
        bridge,
        operationalChain,
        bridgedRecords: excelRecords,
      },
      summary: {
        bridgeStatus: bridge.summary.status,
        sourceType: bridge.summary.sourceType,
        route: bridge.summary.route,
        totalRecords: bridge.summary.totalRecords,
        orchestrationStatus: operationalChain.summary.orchestrationStatus,
        actionCenterStatus: operationalChain.summary.actionCenterStatus,
        postPersistenceStatus: operationalChain.summary.postPersistenceStatus,
      },
      warnings: [...bridge.warnings, ...operationalChain.warnings],
    }
  }

  const operationalChain = runFullDocumentOperationalChain({
    sourceType,
    fileName: params.fileName,
    workbook: params.workbook,
    pdfPages: params.pdfPages,
    wordParagraphs: params.wordParagraphs,
    humanResolutionPayload: params.humanResolutionPayload,
    persistActionCenterItems: params.persistActionCenterItems,
    verifyPersistedItems: params.verifyPersistedItems,
    runRecordsStage: params.runRecordsStage,
    runEnvelopesStage: params.runEnvelopesStage,
    runAuditStage: params.runAuditStage,
    runMetricsStage: params.runMetricsStage,
    runAdminSnapshotStage: params.runAdminSnapshotStage,
    runHealthSnapshotStage: params.runHealthSnapshotStage,
  })

  return {
    data: {
      bridge,
      operationalChain,
      bridgedRecords: [],
    },
    summary: {
      bridgeStatus: bridge.summary.status,
      sourceType: bridge.summary.sourceType,
      route: bridge.summary.route,
      totalRecords: bridge.summary.totalRecords,
      orchestrationStatus: operationalChain.summary.orchestrationStatus,
      actionCenterStatus: operationalChain.summary.actionCenterStatus,
      postPersistenceStatus: operationalChain.summary.postPersistenceStatus,
    },
    warnings: [...bridge.warnings, ...operationalChain.warnings],
  }
}
