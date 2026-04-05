import { describe, expect, it } from "vitest"

import { runHardenedDocumentIntake } from "./run-hardened-document-intake"

describe("STEP 85 — Hardened document intake", () => {
  it("parses excel workbook into normalized hardened records", () => {
    const result = runHardenedDocumentIntake({
      sourceType: "excel",
      fileName: "soa.xlsx",
      workbook: {
        Sheet1: [
          ["Visit", "Procedure", "Fee"],
          ["Screening", "CBC", "125"],
          ["Baseline", "ECG", "300"],
        ],
      },
    })

    expect(result.summary.sourceType).toBe("excel")
    expect(result.summary.totalRecords).toBe(2)
    const r0 = result.data.records[0]!
    expect(r0.fields.visitName?.value).toBe("Screening")
    expect(r0.fields.activityDescription?.value).toBe("CBC")
    expect(r0.fields.unitPrice?.value).toBe("125")
  })

  it("returns warnings for low-structure pdf input", () => {
    const result = runHardenedDocumentIntake({
      sourceType: "pdf",
      fileName: "soa.pdf",
      pdfPages: [
        { text: "Visit Schedule\nScreening Visit\nProcedure Fee CBC 125" },
      ],
    })

    expect(result.summary.sourceType).toBe("pdf")
    expect(result.summary.totalRecords).toBeGreaterThanOrEqual(1)
  })

  it("returns unsupported warning for unknown source", () => {
    const result = runHardenedDocumentIntake({
      sourceType: "unknown",
      fileName: "x.bin",
    })

    expect(result.summary.totalRecords).toBe(0)
    expect(result.warnings[0]!.code).toBe("unsupported_file_type")
  })
})
