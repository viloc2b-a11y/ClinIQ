/**
 * STEP 83 — Ready-to-send email subject + body (plain text; no mailer).
 */

import type { RevenueReportResult } from "./build-revenue-report"

export type RevenueEmailInput = {
  report: RevenueReportResult
}

export type RevenueEmailResult = {
  data: {
    subject: string
    body: string
    topActionsIncluded: number
  }
  summary: {
    subject: string
    atRisk: number
  }
  warnings: string[]
}

export function buildRevenueEmail({ report }: RevenueEmailInput): RevenueEmailResult {
  const top3 = report.data.topFindings.slice(0, 3)

  const subject = `ClinIQ Revenue Summary: $${report.summary.atRisk} at risk identified`

  const body = [
    `Hello,`,
    ``,
    `ClinIQ reviewed current execution and billing signals and identified $${report.summary.atRisk} in revenue currently at risk.`,
    `Current revenue protection score: ${report.summary.score}.`,
    `Total visible revenue opportunity: $${report.summary.totalOpportunity}.`,
    ``,
    `Top priority actions:`,
    ...top3.map(
      (item) => `- ${item.title}: $${item.estimatedValue}`,
    ),
    ``,
    `Next step: review and resolve the highest-value missing or delayed billables first.`,
    ``,
    `ClinIQ`,
  ].join("\n")

  return {
    data: {
      subject,
      body,
      topActionsIncluded: top3.length,
    },
    summary: {
      subject,
      atRisk: report.summary.atRisk,
    },
    warnings: [],
  }
}
