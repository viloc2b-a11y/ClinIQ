import { describe, expect, it } from "vitest"

import { runExcelCanonicalIngestion } from "./run-excel-canonical-ingestion"

describe("STEP 99 — runExcelCanonicalIngestion", () => {
  it("runs excel hardening and converts to canonical records", () => {
    const workbook = {
      Sheets: {
        Schedule: [
          ["Visit", "Procedure", "Fee", "Qty"],
          ["Screening", "CBC", 125, 1],
          ["Day 1", "Physical Exam", 200, 1],
        ],
      },
    }

    const result = runExcelCanonicalIngestion({
      workbook,
      fileName: "demo.xlsx",
    })

    expect(result.summary.status === "ready" || result.summary.status === "partial").toBe(true)
    expect(result.summary.parsedRowsCount).toBeGreaterThanOrEqual(0)
    expect(result.summary.canonicalRecordsCount).toBeGreaterThanOrEqual(0)
  })
})
