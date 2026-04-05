import { describe, expect, it } from "vitest"

import { runExcelAudit } from "./run-excel-audit"

/** Clean sponsor-style grid: one obvious SoA sheet. */
const CLEAN_WORKBOOK: Record<string, unknown> = {
  SoA: [
    ["Visit", "Procedure", "Fee", "Qty"],
    ["Screening", "CBC", 125, 1],
    ["Baseline", "ECG", 300, 1],
    ["Day 15", "Labs", 90, 1],
  ],
}

/**
 * Messy workbook: irrelevant sheet scores moderately, SoA sheet has preamble noise,
 * sparse rows, and a weaker header row to stress boundaries and classification.
 */
const MESSY_WORKBOOK: Record<string, unknown> = {
  Cover: [
    ["Clinical Trial XYZ-001", "", "", ""],
    ["Confidential", "", "", ""],
    ["", "", "", ""],
  ],
  z_SoA_Appendix: [
    ["", "", "", ""],
    ["Section: assessments", "", "", ""],
    ["", "", "", ""],
    ["Timepoint", "Service", "Amount", ""],
    ["", "", "", ""],
    ["", "", "", ""],
    ["", "", "", ""],
    ["", "", "", ""],
    ["", "", "", ""],
    ["", "", "", ""],
    ["V1", "PK draw", 450, ""],
    ["V2", "Urinalysis", 120, ""],
    ["", "", "", ""],
    ["junk", "", "", ""],
  ],
}

describe("STEP 98A — Excel intake accuracy audit", () => {
  it("aggregates honest metrics across clean and messy workbooks", () => {
    const result = runExcelAudit({
      testCases: [
        {
          id: "clean-soa",
          workbook: CLEAN_WORKBOOK,
          expected: {
            minRows: 2,
            requiredFields: ["visitName", "activityDescription"],
            sheetHint: "SoA",
          },
        },
        {
          id: "messy-soa",
          workbook: MESSY_WORKBOOK,
          expected: {
            minRows: 1,
            requiredFields: ["visitName", "activityDescription"],
            sheetHint: "SoA",
          },
        },
      ],
    })

    expect(result.data.results).toHaveLength(2)
    expect(result.summary.avgExtractionRate).toBeGreaterThan(0)
    expect(result.summary.avgExtractionRate).toBeLessThanOrEqual(1)
    expect(result.summary.avgConfidence).toBeGreaterThanOrEqual(0)
    expect(result.summary.passRate).toBeGreaterThanOrEqual(0)
    expect(result.summary.passRate).toBeLessThanOrEqual(1)

    const clean = result.data.results.find((r) => r.testId === "clean-soa")
    const messy = result.data.results.find((r) => r.testId === "messy-soa")
    expect(clean?.status).toBe("pass")
    expect(messy?.status === "partial" || messy?.status === "fail").toBe(true)

    expect(result.summary.passRate).toBe(0.5)

    expect(result.summary.avgExtractionRate).toBe(0.5)
    expect(clean?.extractionRate).toBe(1)
    expect(messy?.extractionRate).toBe(0)
    expect(result.summary.avgConfidence).toBeGreaterThan(0.35)
    expect(result.summary.avgConfidence).toBeLessThan(0.95)
  })
})
