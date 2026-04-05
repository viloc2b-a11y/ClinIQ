import { describe, expect, it } from "vitest"

import { buildDemoOutputSurface } from "./build-demo-output-surface"
import { buildRevenueDashboardCards } from "./build-revenue-dashboard-cards"
import { buildSendReportPayload } from "./build-send-report-payload"
import { renderRevenueReportHtml } from "./render-revenue-report-html"

describe("STEP 84 — Render Layer + Demo Output Surface", () => {
  it("builds render layer outputs", () => {
    const htmlReport = renderRevenueReportHtml({
      pdfPayload: {
        data: {
          title: "ClinIQ Revenue Protection Report",
          headline: "Recovered revenue visibility: $9800 captured, $2650 at risk",
          kpis: {
            capturedRevenue: 9800,
            revenueAtRisk: 2650,
            revenueProtectionScore: 78,
            totalRevenueOpportunity: 12450,
            recoveryRate: 79,
            invoicePackages: 3,
            leakageItems: 5,
          },
          executiveSummary: [
            "ClinIQ identified $2650 in revenue currently at risk.",
            "Current revenue protection score is 78.",
          ],
          topFindings: [
            {
              rank: 1,
              title: "Missing visit billing",
              estimatedValue: 1200,
              trace: {
                studyId: "STUDY-1",
                subjectId: "SUBJ-1",
                visitName: "Week 4",
                lineCode: "LV-001",
                eventLogId: "evt-1",
              },
            },
          ],
        },
        summary: {
          score: 78,
          atRisk: 2650,
        },
        warnings: [],
      },
    })

    const dashboardCards = buildRevenueDashboardCards({
      report: {
        summary: {
          captured: 9800,
          atRisk: 2650,
          score: 78,
          totalOpportunity: 12450,
          recoveryRate: 79,
        },
      },
      prioritized: {
        prioritizedActions: [
          {
            id: "a1",
            title: "Missing visit billing",
            estimatedValue: 1200,
            priorityScore: 1200,
            leakageValue: 1200,
          },
        ],
        summary: {
          total: 5,
          highestValue: 1200,
        },
      },
    })

    const sendReportPayload = buildSendReportPayload({
      email: {
        data: {
          subject: "ClinIQ Revenue Summary: $2650 at risk identified",
          body: "Hello",
          topActionsIncluded: 1,
        },
        summary: {
          subject: "ClinIQ Revenue Summary: $2650 at risk identified",
          atRisk: 2650,
        },
        warnings: [],
      },
      report: {
        summary: {
          captured: 9800,
          atRisk: 2650,
          score: 78,
          totalOpportunity: 12450,
          recoveryRate: 79,
        },
      },
    })

    const demoSurface = buildDemoOutputSurface({
      report: {
        data: {
          headline: "Recovered revenue visibility: $9800 captured, $2650 at risk",
        },
        summary: {
          captured: 9800,
          atRisk: 2650,
          score: 78,
          totalOpportunity: 12450,
          recoveryRate: 79,
        },
        warnings: [],
      },
      dashboardCards,
      htmlReport,
      sendReportPayload,
    })

    expect(htmlReport.data.html).toContain("ClinIQ Revenue Protection Report")
    expect(htmlReport.summary.htmlLength).toBeGreaterThan(0)
    expect(dashboardCards.summary.totalCards).toBe(6)
    expect(sendReportPayload.summary.status).toBe("draft")
    expect(sendReportPayload.data.channel).toBe("email")
    expect(demoSurface.summary.score).toBe(78)
    expect(demoSurface.summary.totalCards).toBe(6)
    expect(demoSurface.data.reportPreviewHtml).toContain("<html>")
    expect(demoSurface.data.sendReport.status).toBe("draft")
  })
})
