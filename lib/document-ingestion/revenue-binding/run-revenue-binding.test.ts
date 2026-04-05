import { describe, expect, it } from "vitest"

import { runRevenueBinding } from "./run-revenue-binding"

describe("STEP 96 — revenue binding", () => {
  it("runs revenue chain from eligible post-persistence flow", () => {
    const result = runRevenueBinding({
      operationalChain: {
        data: {
          downstreamChain: {
            data: {
              persistedItems: [
                {
                  id: "seed-1",
                  type: "soa_activity_review",
                  title: "Screening — CBC",
                  estimatedValue: 125,
                },
              ],
            },
            summary: {
              status: "ready",
              recordsReady: true,
              metricsReady: true,
            },
          },
        },
        summary: {
          postPersistenceStatus: "ready",
          recordsReady: true,
          metricsReady: true,
        },
      },
      buildClaimItemsFromRecords: ({ records }) => ({
        claimItems: records,
        summary: { total: 1, totalAmount: 125 },
        warnings: [],
      }),
      buildInvoicePackages: ({ claimItems }) => ({
        invoicePackages: claimItems,
        summary: { totalPackages: 1, totalAmount: 125 },
        warnings: [],
      }),
      computeRevenueLeakage: ({ actionItems }) => ({
        leakageItems: actionItems,
        summary: { totalItems: 1, totalValue: 125 },
        warnings: [],
      }),
      computeRevenueProtectionScore: () => ({
        score: 50,
        summary: { score: 50 },
        warnings: [],
      }),
      prioritizeRevenueActions: ({ actionItems }) => ({
        prioritizedActions: actionItems,
        summary: { total: 1, highestValue: 125 },
        warnings: [],
      }),
      buildRevenueDashboardSnapshot: () => ({
        data: {},
        summary: { captured: 125, atRisk: 125, score: 50 },
        warnings: [],
      }),
      buildRevenueReport: () => ({
        data: { topFindings: [] },
        summary: {
          captured: 125,
          atRisk: 125,
          score: 50,
          totalOpportunity: 250,
          recoveryRate: 50,
        },
        warnings: [],
      }),
      buildRevenueExecutiveSummary: () => ({
        data: { summaryLines: ["x"] },
        summary: { lineCount: 1, score: 50 },
        warnings: [],
      }),
      buildRevenueEmail: () => ({
        data: { subject: "x", body: "y", topActionsIncluded: 1 },
        summary: { subject: "x", atRisk: 125 },
        warnings: [],
      }),
      buildRevenuePdfPayload: () => ({
        data: {
          title: "t",
          headline: "h",
          kpis: {},
          executiveSummary: [],
          topFindings: [],
        },
        summary: { score: 50, atRisk: 125 },
        warnings: [],
      }),
      renderRevenueReportHtml: () => ({
        data: { html: "<html></html>" },
        summary: { score: 50, atRisk: 125, htmlLength: 13 },
        warnings: [],
      }),
      buildRevenueDashboardCards: () => ({
        data: { cards: [], topAction: null },
        summary: { totalCards: 0, score: 50 },
        warnings: [],
      }),
      buildSendReportPayload: () => ({
        data: {
          channel: "email",
          subject: "x",
          body: "y",
          metadata: {},
          status: "draft",
        },
        summary: { channel: "email", status: "draft", atRisk: 125 },
        warnings: [],
      }),
      buildDemoOutputSurface: () => ({
        data: {
          hero: {},
          cards: [],
          topAction: null,
          reportPreviewHtml: "",
          sendReport: {},
        },
        summary: { score: 50, atRisk: 125, totalCards: 0, htmlLength: 13 },
        warnings: [],
      }),
    })

    expect(result.summary.revenueReady).toBe(true)
    expect(result.summary.claimsReady).toBe(true)
    expect(result.summary.invoicesReady).toBe(true)
    expect(result.summary.leakageReady).toBe(true)
  })

  it("blocks revenue chain when post-persistence flow is not eligible", () => {
    const result = runRevenueBinding({
      operationalChain: {
        data: {
          downstreamChain: {
            data: {
              persistedItems: [],
            },
            summary: {
              status: "blocked",
              recordsReady: false,
              metricsReady: false,
            },
          },
        },
        summary: {
          postPersistenceStatus: "blocked",
          recordsReady: false,
          metricsReady: false,
        },
      },
    })

    expect(result.summary.status).toBe("blocked")
    expect(result.summary.revenueReady).toBe(false)
  })
})
