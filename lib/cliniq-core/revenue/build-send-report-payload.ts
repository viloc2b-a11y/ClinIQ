/**
 * STEP 84 — Draft send payload (email channel) — no provider / transport.
 */

import type { RevenueEmailResult } from "./build-revenue-email"
import type { RevenueReportResult } from "./build-revenue-report"

export type BuildSendReportPayloadInput = {
  email: RevenueEmailResult
  report: Pick<RevenueReportResult, "summary">
}

export type BuildSendReportPayloadResult = {
  data: {
    channel: "email"
    subject: string
    body: string
    metadata: {
      atRisk: number
      captured: number
      score: number
    }
    status: "draft"
  }
  summary: {
    channel: "email"
    status: "draft"
    atRisk: number
  }
  warnings: string[]
}

export function buildSendReportPayload({
  email,
  report,
}: BuildSendReportPayloadInput): BuildSendReportPayloadResult {
  return {
    data: {
      channel: "email",
      subject: email.data.subject,
      body: email.data.body,
      metadata: {
        atRisk: report.summary.atRisk,
        captured: report.summary.captured,
        score: report.summary.score,
      },
      status: "draft",
    },
    summary: {
      channel: "email",
      status: "draft",
      atRisk: report.summary.atRisk,
    },
    warnings: email.warnings,
  }
}
