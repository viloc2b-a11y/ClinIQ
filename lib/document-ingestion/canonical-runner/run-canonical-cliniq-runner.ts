import { runFullDocumentRevenueBridge } from "../bridges/run-full-document-revenue-bridge"
import type { HumanResolutionPayload } from "../human-resolution/types"
import { buildCommercialSurface } from "./build-commercial-surface"
import { evaluateCanonicalRunnerStatus } from "./evaluate-canonical-runner-status"

export function runCanonicalClinIQRunner(params: {
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
  const pipeline = runFullDocumentRevenueBridge({
    fileName: params.fileName,
    mimeType: params.mimeType ?? undefined,
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

  const sourceType = pipeline.summary.sourceType
  const route: "excel_hardened" | "legacy" | "unknown" =
    pipeline.summary.route === "excel_hardened" || pipeline.summary.route === "legacy"
      ? pipeline.summary.route
      : "unknown"

  const documentReady =
    pipeline.summary.bridgeStatus === "ready" || pipeline.summary.bridgeStatus === "partial"

  const actionCenterReady =
    pipeline.summary.actionCenterStatus === "persisted"

  const postPersistenceReady =
    pipeline.summary.postPersistenceStatus === "ready" ||
    pipeline.summary.postPersistenceStatus === "partial"

  const revenueReady = pipeline.summary.revenueReady === true
  const outputsReady = pipeline.summary.outputsReady === true

  const commercial = buildCommercialSurface({
    fileName: params.fileName ?? null,
    sourceType,
    route,
    bridgeStatus: pipeline.summary.bridgeStatus,
    orchestrationStatus: pipeline.summary.orchestrationStatus,
    actionCenterStatus: pipeline.summary.actionCenterStatus,
    postPersistenceStatus: pipeline.summary.postPersistenceStatus,
    revenueStatus: pipeline.summary.revenueStatus,
    revenueReady,
    outputsReady,
    warnings: pipeline.warnings,
  })

  const status = evaluateCanonicalRunnerStatus({
    route,
    sourceType,
    documentReady,
    actionCenterReady,
    postPersistenceReady,
    revenueReady,
    outputsReady,
  })

  const revenueData =
    pipeline &&
    pipeline.data &&
    pipeline.data.revenue &&
    typeof pipeline.data.revenue === "object"
      ? ((pipeline.data.revenue as { data?: Record<string, unknown> }).data ?? {})
      : {}

  return {
    data: {
      sourceInput: {
        fileName: params.fileName ?? null,
        sourceType,
        route,
      },
      pipeline,
      operational: pipeline.data.operational,
      revenue: pipeline.data.revenue,
      commercialSurface: commercial.data.commercialSurface,
      outputs: {
        report: revenueData.report ?? null,
        executiveSummary: revenueData.executiveSummary ?? null,
        email: revenueData.email ?? null,
        pdfPayload: revenueData.pdfPayload ?? null,
        htmlReport: revenueData.htmlReport ?? null,
        dashboardCards: revenueData.dashboardCards ?? null,
        sendReportPayload: revenueData.sendReportPayload ?? null,
        demoSurface: revenueData.demoSurface ?? null,
      },
    },
    summary: {
      status: status.data.status,
      sourceType,
      route,
      documentReady,
      actionCenterReady,
      postPersistenceReady,
      revenueReady,
      outputsReady,
    },
    warnings: [...pipeline.warnings, ...commercial.warnings, ...status.warnings],
  }
}
