/**
 * STEP 84 — Single demo-ready bundle: hero, cards, HTML preview, draft send payload.
 */

import type { BuildRevenueDashboardCardsResult } from "./build-revenue-dashboard-cards"
import type { BuildSendReportPayloadResult } from "./build-send-report-payload"
import type { RenderRevenueReportHtmlResult } from "./render-revenue-report-html"
import type { RevenueReportResult } from "./build-revenue-report"

export type BuildDemoOutputSurfaceInput = {
  report: Pick<RevenueReportResult, "data" | "summary" | "warnings">
  dashboardCards: BuildRevenueDashboardCardsResult
  htmlReport: RenderRevenueReportHtmlResult
  sendReportPayload: BuildSendReportPayloadResult
}

export type BuildDemoOutputSurfaceResult = {
  data: {
    hero: {
      headline: string
      score: number
      captured: number
      atRisk: number
      recoveryRate: number
    }
    cards: BuildRevenueDashboardCardsResult["data"]["cards"]
    topAction: BuildRevenueDashboardCardsResult["data"]["topAction"]
    reportPreviewHtml: string
    sendReport: BuildSendReportPayloadResult["data"]
  }
  summary: {
    score: number
    atRisk: number
    totalCards: number
    htmlLength: number
  }
  warnings: string[]
}

export function buildDemoOutputSurface({
  report,
  dashboardCards,
  htmlReport,
  sendReportPayload,
}: BuildDemoOutputSurfaceInput): BuildDemoOutputSurfaceResult {
  return {
    data: {
      hero: {
        headline: report.data.headline,
        score: report.summary.score,
        captured: report.summary.captured,
        atRisk: report.summary.atRisk,
        recoveryRate: report.summary.recoveryRate,
      },
      cards: dashboardCards.data.cards,
      topAction: dashboardCards.data.topAction,
      reportPreviewHtml: htmlReport.data.html,
      sendReport: sendReportPayload.data,
    },
    summary: {
      score: report.summary.score,
      atRisk: report.summary.atRisk,
      totalCards: dashboardCards.summary.totalCards,
      htmlLength: htmlReport.summary.htmlLength,
    },
    warnings: [
      ...report.warnings,
      ...dashboardCards.warnings,
      ...htmlReport.warnings,
      ...sendReportPayload.warnings,
    ],
  }
}
