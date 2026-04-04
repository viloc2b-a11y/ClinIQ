import { describe, expect, it } from "vitest"

import type { InvoicePackage } from "../claims/types"
import type { ExpectedBillable } from "./types"
import { buildLeakageSummary } from "./leakage-summary"
import type { QuantifiedRevenueLeakageReport } from "./quantify-leakage"
import { quantifyRevenueLeakage } from "./quantify-leakage"

function sampleExpected(): ExpectedBillable[] {
  return [
    {
      id: "exp-su",
      budgetLineId: "b-su",
      studyId: "S-1",
      lineCode: "SU",
      label: "Startup fee",
      category: "Startup",
      visitName: "N/A",
      unit: "ls",
      expectedQuantity: 1,
      unitPrice: 8000,
      expectedRevenue: 8000,
    },
  ]
}

function sampleInvoice(): InvoicePackage {
  return {
    schemaVersion: "1.0",
    studyId: "S-1",
    sponsorId: "SP-1",
    invoicePeriodStart: "2026-01-01",
    invoicePeriodEnd: "2026-01-31",
    generatedAt: "2026-02-01T00:00:00.000Z",
    lines: [
      {
        id: "il-1",
        studyId: "S-1",
        sponsorId: "SP-1",
        eventDate: "2026-01-10",
        lineCode: "SU",
        label: "Startup fee",
        amount: 8000,
        status: "ready",
        claimItemId: "ci-1",
      },
    ],
    subtotal: 8000,
    lineCount: 1,
    hasBlockingIssues: false,
  }
}

describe("buildLeakageSummary", () => {
  it("maps quantifyRevenueLeakage output and caps top leakers", () => {
    const report = quantifyRevenueLeakage(sampleExpected(), sampleInvoice())
    const summary = buildLeakageSummary(report)

    expect(summary.expectedRevenue).toBe(report.totalExpected)
    expect(summary.invoicedRevenue).toBe(report.totalInvoiced)
    expect(summary.leakedRevenue).toBe(report.totalLeakage)
    expect(summary.leakageRatePct).toBe(Math.round(report.leakagePct * 100 * 10) / 10)
    expect(["ok", "warning", "critical"] as const).toContain(summary.status)
    expect(summary.topLeakers.length).toBeLessThanOrEqual(3)
  })

  it("rounds leakageRatePct to one decimal in 0–100 space", () => {
    const report: QuantifiedRevenueLeakageReport = {
      studyId: "S-X",
      invoicePeriodStart: "2026-01-01",
      invoicePeriodEnd: "2026-01-31",
      totalExpected: 1000,
      totalInvoiced: 833,
      totalLeakage: 167,
      leakagePct: 0.167,
      status: "warning",
      lineBreakdown: [],
      topLeakers: [
        {
          lineCode: "A",
          label: "Line A",
          expected: 1000,
          invoiced: 833,
          leakage: 167,
          leakagePct: 0.167,
          status: "warning",
        },
      ],
    }
    const summary = buildLeakageSummary(report)
    expect(summary.leakageRatePct).toBe(16.7)
    expect(summary.topLeakers).toHaveLength(1)
    expect(summary.topLeakers[0]).toEqual({
      lineCode: "A",
      label: "Line A",
      leakage: 167,
    })
  })
})
