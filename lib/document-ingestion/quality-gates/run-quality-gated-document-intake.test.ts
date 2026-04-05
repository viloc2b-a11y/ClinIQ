import { describe, expect, it } from "vitest"

import { runQualityGatedDocumentIntake } from "./run-quality-gated-document-intake"

describe("STEP 87 — Quality gates + parse acceptance", () => {
  it("accepts strong soa excel parse", () => {
    const result = runQualityGatedDocumentIntake({
      sourceType: "excel",
      fileName: "study_soa.xlsx",
      workbook: {
        Sheet1: [
          ["Visit", "Procedure", "Fee"],
          ["Screening", "CBC", "125"],
          ["Baseline", "ECG", "300"],
        ],
      },
    })

    expect(result.summary.accepted).toBe(true)
    expect(
      result.summary.acceptanceStatus === "accepted" ||
        result.summary.acceptanceStatus === "accepted_with_warnings",
    ).toBe(true)
  })

  it("routes weak fallback parse to manual review", () => {
    const result = runQualityGatedDocumentIntake({
      sourceType: "pdf",
      fileName: "misc_notes.pdf",
      pdfPages: [
        { text: "random notes with little structure and no clear fee schedule" },
      ],
    })

    expect(
      result.summary.acceptanceStatus === "manual_review_required" ||
        result.summary.acceptanceStatus === "rejected",
    ).toBe(true)
  })

  it("rejects unknown source type", () => {
    const result = runQualityGatedDocumentIntake({
      sourceType: "unknown",
      fileName: "binary.dat",
    })

    expect(result.summary.acceptanceStatus).toBe("rejected")
    expect(result.summary.accepted).toBe(false)
  })
})
