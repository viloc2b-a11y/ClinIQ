import { describe, expect, it } from "vitest"

import type { ExtractedRow } from "./extract-row-fields"
import { runExcelHardening } from "./run-excel-hardening"
import { toCanonicalRecords } from "./to-canonical-records"

describe("STEP 98 — Excel hardening orchestrator", () => {
  it("selects ranked sheet, extracts rows, and maps to canonical records", () => {
    const workbook = {
      Budget_Summary: [["a", "b"]],
      SoA_Main: [
        ["Visit", "Procedure", "Fee"],
        ["Screening", "CBC", 200],
      ],
    }

    const hardened = runExcelHardening({ workbook })
    expect(hardened.data.selectedSheet).toBe("SoA_Main")
    expect(hardened.summary.usableRows).toBeGreaterThanOrEqual(1)
    expect(hardened.summary.extractionRate).toBeGreaterThan(0)

    const canonical = toCanonicalRecords({
      selectedSheet: hardened.data.selectedSheet,
      parsedRows: hardened.data.parsedRows as ExtractedRow[],
      fileName: "trial.xlsx",
    })

    expect(canonical.data.records.some((r) => r.recordType === "soa_activity")).toBe(true)
    expect(canonical.data.records[0]?.fields.visitName).toBeDefined()
  })
})
