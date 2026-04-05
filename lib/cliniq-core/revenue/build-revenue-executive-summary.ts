/**
 * STEP 83 — Executive narrative lines from a revenue report (deterministic).
 */

import type { RevenueReportResult } from "./build-revenue-report"

export type RevenueExecutiveSummaryInput = {
  report: RevenueReportResult
}

export type RevenueExecutiveSummaryResult = {
  data: {
    summaryLines: string[]
    topIssue: RevenueReportResult["data"]["topFindings"][0] | null
  }
  summary: {
    lineCount: number
    score: number
  }
  warnings: string[]
}

export function buildRevenueExecutiveSummary({
  report,
}: RevenueExecutiveSummaryInput): RevenueExecutiveSummaryResult {
  const topIssue = report.data.topFindings[0]

  const summaryLines = [
    `ClinIQ identified $${report.summary.atRisk} in revenue currently at risk.`,
    `Current revenue protection score is ${report.summary.score}.`,
    `Total visible revenue opportunity is $${report.summary.totalOpportunity}.`,
    topIssue
      ? `Highest-value action: ${topIssue.title} ($${topIssue.estimatedValue}).`
      : `No high-priority revenue actions detected.`,
  ]

  return {
    data: {
      summaryLines,
      topIssue: topIssue || null,
    },
    summary: {
      lineCount: summaryLines.length,
      score: report.summary.score,
    },
    warnings: report.warnings,
  }
}
