import type { HumanResolutionPayload } from "../human-resolution/types"
import { runFullDocumentRevenueChain } from "../revenue-binding/run-full-document-revenue-chain"
import { buildCommercialSnapshot } from "./build-commercial-snapshot"
import { evaluateCanonicalDemoStatus } from "./evaluate-canonical-demo-status"

export function runCanonicalDemo(params: {
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
  buildClaimItemsFromRecords?: (input: { records: unknown[] }) => unknown
  buildInvoicePackages?: (input: { claimItems: unknown[] }) => unknown
  computeRevenueLeakage?: (input: { actionItems: unknown[] }) => unknown
  computeRevenueProtectionScore?: (input: { invoices: unknown; leakage: unknown }) => unknown
  prioritizeRevenueActions?: (input: { actionItems: unknown[] }) => unknown
  buildRevenueDashboardSnapshot?: (input: {
    invoices: unknown
    leakage: unknown
    score: unknown
    prioritizedActions: unknown
  }) => unknown
  buildRevenueReport?: (input: {
    dashboard: unknown
    leakage: unknown
    invoices: unknown
  }) => unknown
  buildRevenueExecutiveSummary?: (input: { report: unknown }) => unknown
  buildRevenueEmail?: (input: { report: unknown }) => unknown
  buildRevenuePdfPayload?: (input: {
    report: unknown
    executiveSummary: unknown
  }) => unknown
  renderRevenueReportHtml?: (input: { pdfPayload: unknown }) => unknown
  buildRevenueDashboardCards?: (input: {
    report: unknown
    prioritized: unknown
  }) => unknown
  buildSendReportPayload?: (input: {
    email: unknown
    report: unknown
  }) => unknown
  buildDemoOutputSurface?: (input: {
    report: unknown
    dashboardCards: unknown
    htmlReport: unknown
    sendReportPayload: unknown
  }) => unknown
}) {
  const pipeline = runFullDocumentRevenueChain({
    sourceType: params.sourceType,
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
    buildClaimItemsFromRecords: params.buildClaimItemsFromRecords,
    buildInvoicePackages: params.buildInvoicePackages,
    computeRevenueLeakage: params.computeRevenueLeakage,
    computeRevenueProtectionScore: params.computeRevenueProtectionScore,
    prioritizeRevenueActions: params.prioritizeRevenueActions,
    buildRevenueDashboardSnapshot: params.buildRevenueDashboardSnapshot,
    buildRevenueReport: params.buildRevenueReport,
    buildRevenueExecutiveSummary: params.buildRevenueExecutiveSummary,
    buildRevenueEmail: params.buildRevenueEmail,
    buildRevenuePdfPayload: params.buildRevenuePdfPayload,
    renderRevenueReportHtml: params.renderRevenueReportHtml,
    buildRevenueDashboardCards: params.buildRevenueDashboardCards,
    buildSendReportPayload: params.buildSendReportPayload,
    buildDemoOutputSurface: params.buildDemoOutputSurface,
  })

  const operationalSummary = (
    pipeline.data.operationalChain as {
      summary?: { recordsReady?: boolean; metricsReady?: boolean }
    } | null
  )?.summary

  const commercialSnapshotResult = buildCommercialSnapshot({
    result: {
      summary: {
        sourceType: params.sourceType,
        postPersistenceStatus: pipeline.summary.postPersistenceStatus,
        revenueStatus: pipeline.summary.revenueStatus,
        revenueReady: pipeline.summary.revenueReady,
        outputsReady: pipeline.summary.outputsReady,
        recordsReady: operationalSummary?.recordsReady === true,
        metricsReady: operationalSummary?.metricsReady === true,
        actionCenterStatus: pipeline.summary.actionCenterStatus,
      },
      warnings: pipeline.warnings,
      data: {
        revenue: pipeline.data.revenue,
      },
    },
  })

  const documentAccepted =
    pipeline.summary.orchestrationStatus === "ready" ||
    pipeline.summary.orchestrationStatus === "partial"

  const actionCenterReady =
    pipeline.summary.actionCenterStatus === "persisted" ||
    pipeline.summary.actionCenterStatus === "partial"

  const recordsReady = operationalSummary?.recordsReady === true
  const metricsReady =
    pipeline.summary.leakageReady === true || pipeline.summary.revenueReady === true

  const status = evaluateCanonicalDemoStatus({
    documentAccepted,
    actionCenterReady,
    recordsReady,
    metricsReady,
    revenueReady: pipeline.summary.revenueReady,
    outputsReady: pipeline.summary.outputsReady,
  })

  return {
    data: {
      sourceInput: {
        sourceType: params.sourceType,
        fileName: params.fileName || null,
      },
      pipeline,
      operationalChain: pipeline.data.operationalChain,
      revenue: pipeline.data.revenue,
      finalSummary: {
        documentAccepted,
        actionCenterReady,
        recordsReady,
        metricsReady,
        revenueReady: pipeline.summary.revenueReady,
        outputsReady: pipeline.summary.outputsReady,
      },
      commercialSnapshot: commercialSnapshotResult.data.commercialSnapshot,
      demoSurface: pipeline.data.revenue?.data?.demoSurface || null,
    },
    summary: {
      status: status.data.status,
      sourceType: params.sourceType,
      documentAccepted,
      actionCenterReady,
      recordsReady,
      metricsReady,
      revenueReady: pipeline.summary.revenueReady,
      outputsReady: pipeline.summary.outputsReady,
    },
    warnings: [
      ...pipeline.warnings,
      ...commercialSnapshotResult.warnings,
      ...status.warnings,
    ],
  }
}
