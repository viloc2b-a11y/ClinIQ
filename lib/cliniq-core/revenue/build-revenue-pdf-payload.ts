/**
 * STEP 83 — Structured payload for a future PDF/export renderer (no rendering here).
 */

import type { RevenueExecutiveSummaryResult } from "./build-revenue-executive-summary"
import type { RevenueReportResult } from "./build-revenue-report"

export type RevenuePdfPayloadInput = {
  report: RevenueReportResult
  executiveSummary: Pick<RevenueExecutiveSummaryResult, "data">
}

export type RevenuePdfPayloadResult = {
  data: {
    title: string
    headline: string
    kpis: {
      capturedRevenue: number
      revenueAtRisk: number
      revenueProtectionScore: number
      totalRevenueOpportunity: number
      recoveryRate: number
      invoicePackages: number
      leakageItems: number
    }
    executiveSummary: string[]
    topFindings: RevenueReportResult["data"]["topFindings"]
  }
  summary: {
    score: number
    atRisk: number
  }
  warnings: string[]
}

export function buildRevenuePdfPayload({
  report,
  executiveSummary,
}: RevenuePdfPayloadInput): RevenuePdfPayloadResult {
  return {
    data: {
      title: "ClinIQ Revenue Protection Report",
      headline: report.data.headline,
      kpis: {
        capturedRevenue: report.summary.captured,
        revenueAtRisk: report.summary.atRisk,
        revenueProtectionScore: report.summary.score,
        totalRevenueOpportunity: report.summary.totalOpportunity,
        recoveryRate: report.summary.recoveryRate,
        invoicePackages: report.data.totalInvoicePackages,
        leakageItems: report.data.leakageItems,
      },
      executiveSummary: executiveSummary.data.summaryLines,
      topFindings: report.data.topFindings,
    },
    summary: {
      score: report.summary.score,
      atRisk: report.summary.atRisk,
    },
    warnings: report.warnings,
  }
}
