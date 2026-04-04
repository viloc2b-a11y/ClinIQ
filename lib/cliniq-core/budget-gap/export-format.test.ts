import { describe, expect, it } from "vitest"

import { buildBudgetGapAnalysisExport, gapLinesToCsv } from "./export-format"
import type { BudgetGapLine } from "./types"

const sampleLine: BudgetGapLine = {
  id: "gap-1",
  lineCode: "L1",
  category: "Visit",
  label: 'Note, with "quotes"',
  visitName: "V1",
  quantity: 2,
  unit: "ea",
  internalUnitCost: 100,
  internalTotal: 200,
  sponsorUnitOffer: 90,
  sponsorTotalOffer: 180,
  gapAmount: -20,
  gapPercent: -0.1,
  status: "loss",
  notes: "multi\nline",
  source: "merged",
}

describe("gapLinesToCsv", () => {
  it("includes a header row and escapes CSV special characters", () => {
    const csv = gapLinesToCsv([sampleLine])
    expect(csv.split("\n")[0]).toContain("lineCode")
    expect(csv).toContain('"Note, with ""quotes"""')
    expect(csv).toMatch(/"multi\nline"/)
  })
})

describe("buildBudgetGapAnalysisExport", () => {
  it("embeds negotiationEngineInput for Module 4 hand-off", () => {
    const result = {
      gapLines: [sampleLine],
      missingInvoiceables: [],
      summary: {
        totalInternalRevenue: 200,
        totalSponsorRevenue: 180,
        totalGap: -20,
        totalGapPerPatient: null,
        projectedStudyGap: null,
        recommendedRevenueTargetAt20Margin: 240,
        negativeCashFlowRisk: true,
        primaryAlerts: ["a"],
      },
    }
    const exp = buildBudgetGapAnalysisExport(
      result,
      { studyId: "S1" },
      undefined,
      { exportedAt: "2026-04-03T00:00:00.000Z" },
    )
    expect(exp.schemaVersion).toBe("1.0")
    expect(exp.exportedAt).toBe("2026-04-03T00:00:00.000Z")
    expect(exp.negotiationEngineInput.schemaVersion).toBe("1.0")
    expect(exp.negotiationEngineInput.lines[0].negotiationPriority).toBe("high")
    expect(exp.compareInput).toBeUndefined()
  })

  it("optionally retains the original compare input", () => {
    const input = {
      internalLines: [],
      sponsorLines: [],
      studyMeta: { studyId: "X" },
    }
    const exp = buildBudgetGapAnalysisExport(
      {
        gapLines: [],
        missingInvoiceables: [],
        summary: {
          totalInternalRevenue: 0,
          totalSponsorRevenue: 0,
          totalGap: 0,
          totalGapPerPatient: null,
          projectedStudyGap: null,
          recommendedRevenueTargetAt20Margin: 0,
          negativeCashFlowRisk: false,
          primaryAlerts: [],
        },
      },
      { studyId: "X" },
      input,
      { exportedAt: "2026-04-03T00:00:00.000Z" },
    )
    expect(exp.compareInput).toBe(input)
  })
})
