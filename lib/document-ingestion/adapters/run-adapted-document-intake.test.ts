import { describe, expect, it } from "vitest"

import { runAdaptedDocumentIntake } from "./run-adapted-document-intake"

describe("STEP 86 — Sponsor layout adapters", () => {
  it("routes soa-like excel into soa adapter", () => {
    const result = runAdaptedDocumentIntake({
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

    expect(result.summary.sourceType).toBe("excel")
    expect(result.summary.adaptedRecords).toBeGreaterThan(0)
    expect(result.summary.fallbackUsed).toBe(false)
    expect(result.summary.adapterId).toBe("soa-v1")
  })

  it("routes budget-like word content into budget or fallback records", () => {
    const result = runAdaptedDocumentIntake({
      sourceType: "word",
      fileName: "site_budget.docx",
      wordParagraphs: [
        "Clinical Trial Budget",
        "Screening visit fee is 150 dollars.",
        "Baseline ECG fee is 300 dollars.",
      ],
    })

    expect(result.summary.hardenedRecords).toBeGreaterThanOrEqual(1)
    expect(result.summary.adaptedRecords).toBeGreaterThanOrEqual(1)
  })

  it("routes contract-like word content into contract adapter", () => {
    const result = runAdaptedDocumentIntake({
      sourceType: "word",
      fileName: "clinical_trial_agreement.docx",
      wordParagraphs: [
        "Confidentiality. The parties will keep all data confidential.",
        "Payment terms. Sponsor will pay within 45 days.",
        "Termination. Either party may terminate with notice.",
      ],
    })

    expect(result.summary.adaptedRecords).toBeGreaterThan(0)
    expect(result.summary.fallbackUsed).toBe(false)
    expect(result.summary.adapterId).toBe("contract-v1")
  })

  it("uses fallback when adapter intent is unknown", () => {
    const result = runAdaptedDocumentIntake({
      sourceType: "pdf",
      fileName: "misc_notes.pdf",
      pdfPages: [{ text: "random operational notes without sponsor structure" }],
    })

    expect(result.summary.fallbackUsed).toBe(true)
  })
})
