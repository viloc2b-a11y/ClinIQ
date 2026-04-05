import { describe, expect, it } from "vitest"

import { buildRevenueEmail } from "./build-revenue-email"
import { buildRevenueExecutiveSummary } from "./build-revenue-executive-summary"
import { buildRevenuePdfPayload } from "./build-revenue-pdf-payload"
import { buildRevenueReport } from "./build-revenue-report"

describe("STEP 83 — Revenue Output Layer", () => {
  it("builds full revenue output payloads", () => {
    const report = buildRevenueReport({
      dashboard: {
        data: {
          totalRevenueCaptured: 9800,
          totalRevenueAtRisk: 2650,
          protectionScore: 78,
          topActions: [
            {
              id: "a1",
              title: "Missing visit billing",
              estimatedValue: 1200,
              studyId: "STUDY-1",
              subjectId: "SUBJ-1",
              visitName: "Week 4",
              lineCode: "LV-001",
              eventLogId: "evt-1",
            },
          ],
        },
        summary: {
          captured: 9800,
          atRisk: 2650,
          score: 78,
        },
        warnings: [],
      },
      leakage: {
        summary: {
          totalItems: 5,
          totalValue: 2650,
        },
        warnings: ["Revenue leakage detected"],
      },
      invoices: {
        summary: {
          totalPackages: 3,
          totalAmount: 9800,
        },
        warnings: [],
      },
    })

    const executiveSummary = buildRevenueExecutiveSummary({ report })
    const email = buildRevenueEmail({ report })
    const pdfPayload = buildRevenuePdfPayload({ report, executiveSummary })

    expect(report.summary.atRisk).toBe(2650)
    expect(report.summary.totalOpportunity).toBe(12450)
    expect(report.summary.recoveryRate).toBe(79)
    expect(report.warnings).toContain("Revenue leakage detected")

    expect(executiveSummary.summary.score).toBe(78)
    expect(executiveSummary.summary.lineCount).toBe(4)
    expect(executiveSummary.data.topIssue?.title).toBe("Missing visit billing")

    expect(email.data.subject).toContain("$2650")
    expect(email.data.body).toContain("Top priority actions:")

    expect(pdfPayload.data.kpis.revenueAtRisk).toBe(2650)
    expect(pdfPayload.data.title).toBe("ClinIQ Revenue Protection Report")
    expect(pdfPayload.data.executiveSummary.length).toBe(4)
  })
})
