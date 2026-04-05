import { shouldRunRevenueChain } from "./should-run-revenue-chain"
import { buildRevenueRecordsInput } from "./build-revenue-records-input"
import { buildRevenueActionItemsInput } from "./build-revenue-action-items-input"
import { evaluateRevenueBindingStatus } from "./evaluate-revenue-binding-status"

export function runRevenueBinding(params: {
  operationalChain: {
    data: {
      downstreamChain: {
        data: {
          persistedItems: Array<{
            id: string
            type: string
            title: string
            estimatedValue: number
            sourceTrace?: Record<string, unknown> | null
          }>
        }
        summary: {
          status: "ready" | "partial" | "blocked"
          recordsReady: boolean
          metricsReady: boolean
        }
      }
    }
    summary: {
      postPersistenceStatus: "ready" | "partial" | "blocked"
      recordsReady: boolean
      metricsReady: boolean
    }
  }
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
  const decision = shouldRunRevenueChain({
    postPersistenceStatus: params.operationalChain.summary.postPersistenceStatus,
    recordsReady: params.operationalChain.summary.recordsReady,
    metricsReady: params.operationalChain.summary.metricsReady,
  })

  const persistedItems =
    params.operationalChain.data.downstreamChain.data.persistedItems || []

  const recordsInput = buildRevenueRecordsInput({
    persistedItems,
  })

  const actionItemsInput = buildRevenueActionItemsInput({
    persistedItems,
  })

  if (!decision.data.allowed) {
    return {
      data: {
        recordsInput: recordsInput.data.records,
        actionItemsInput: actionItemsInput.data.actionItems,
        claims: null,
        invoices: null,
        leakage: null,
        score: null,
        prioritized: null,
        dashboard: null,
        report: null,
        executiveSummary: null,
        email: null,
        pdfPayload: null,
        htmlReport: null,
        dashboardCards: null,
        sendReportPayload: null,
        demoSurface: null,
      },
      summary: {
        status: "blocked" as const,
        revenueReady: false,
        claimsReady: false,
        invoicesReady: false,
        leakageReady: false,
        outputsReady: false,
      },
      warnings: [
        ...decision.warnings,
        ...recordsInput.warnings,
        ...actionItemsInput.warnings,
      ],
    }
  }

  const claims =
    params.buildClaimItemsFromRecords?.({
      records: recordsInput.data.records,
    }) || null

  const claimItems =
    claims &&
    typeof claims === "object" &&
    "claimItems" in (claims as Record<string, unknown>)
      ? (claims as { claimItems: unknown[] }).claimItems
      : claims &&
          typeof claims === "object" &&
          "data" in (claims as Record<string, unknown>) &&
          (claims as { data?: { claimItems?: unknown[] } }).data?.claimItems
        ? (claims as { data: { claimItems: unknown[] } }).data.claimItems
        : []

  const invoices =
    params.buildInvoicePackages?.({
      claimItems,
    }) || null

  const leakage =
    params.computeRevenueLeakage?.({
      actionItems: actionItemsInput.data.actionItems,
    }) || null

  const score =
    invoices && leakage && params.computeRevenueProtectionScore
      ? params.computeRevenueProtectionScore({ invoices, leakage })
      : null

  const prioritized =
    params.prioritizeRevenueActions?.({
      actionItems: actionItemsInput.data.actionItems,
    }) || null

  const dashboard =
    invoices &&
    leakage &&
    score &&
    prioritized &&
    params.buildRevenueDashboardSnapshot
      ? params.buildRevenueDashboardSnapshot({
          invoices,
          leakage,
          score,
          prioritizedActions: prioritized,
        })
      : null

  const report =
    dashboard && leakage && invoices && params.buildRevenueReport
      ? params.buildRevenueReport({
          dashboard,
          leakage,
          invoices,
        })
      : null

  const executiveSummary =
    report && params.buildRevenueExecutiveSummary
      ? params.buildRevenueExecutiveSummary({
          report,
        })
      : null

  const email =
    report && params.buildRevenueEmail
      ? params.buildRevenueEmail({
          report,
        })
      : null

  const pdfPayload =
    report && executiveSummary && params.buildRevenuePdfPayload
      ? params.buildRevenuePdfPayload({
          report,
          executiveSummary,
        })
      : null

  const htmlReport =
    pdfPayload && params.renderRevenueReportHtml
      ? params.renderRevenueReportHtml({
          pdfPayload,
        })
      : null

  const dashboardCards =
    report && prioritized && params.buildRevenueDashboardCards
      ? params.buildRevenueDashboardCards({
          report,
          prioritized,
        })
      : null

  const sendReportPayload =
    email && report && params.buildSendReportPayload
      ? params.buildSendReportPayload({
          email,
          report,
        })
      : null

  const demoSurface =
    report &&
    dashboardCards &&
    htmlReport &&
    sendReportPayload &&
    params.buildDemoOutputSurface
      ? params.buildDemoOutputSurface({
          report,
          dashboardCards,
          htmlReport,
          sendReportPayload,
        })
      : null

  const status = evaluateRevenueBindingStatus({
    claimsReady: claims != null,
    invoicesReady: invoices != null,
    leakageReady: leakage != null,
    outputsReady:
      report != null &&
      executiveSummary != null &&
      email != null &&
      pdfPayload != null &&
      htmlReport != null &&
      dashboardCards != null &&
      sendReportPayload != null &&
      demoSurface != null,
  })

  return {
    data: {
      recordsInput: recordsInput.data.records,
      actionItemsInput: actionItemsInput.data.actionItems,
      claims,
      invoices,
      leakage,
      score,
      prioritized,
      dashboard,
      report,
      executiveSummary,
      email,
      pdfPayload,
      htmlReport,
      dashboardCards,
      sendReportPayload,
      demoSurface,
    },
    summary: {
      status: status.data.status,
      revenueReady: status.data.status === "ready" || status.data.status === "partial",
      claimsReady: claims != null,
      invoicesReady: invoices != null,
      leakageReady: leakage != null,
      outputsReady:
        report != null &&
        executiveSummary != null &&
        email != null &&
        pdfPayload != null &&
        htmlReport != null &&
        dashboardCards != null &&
        sendReportPayload != null &&
        demoSurface != null,
    },
    warnings: [
      ...recordsInput.warnings,
      ...actionItemsInput.warnings,
      ...status.warnings,
    ],
  }
}
