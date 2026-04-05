import { runCanonicalClinIQRunner } from "../canonical-runner/run-canonical-cliniq-runner"
import type { HumanResolutionPayload } from "../human-resolution/types"
import { buildCanonicalDemoPayload } from "./build-canonical-demo-payload"

export function runCanonicalDemoPayload(params: {
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
  const runnerResult = runCanonicalClinIQRunner({
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

  const payload = buildCanonicalDemoPayload({
    runnerResult,
  })

  return {
    data: {
      runnerResult,
      payload: payload.data,
    },
    summary: payload.summary,
    warnings: [...runnerResult.warnings, ...payload.warnings],
  }
}
