import { describe, expect, it } from "vitest"

import { runDocumentIngestionV2 } from "./run-document-ingestion-v2"

describe("STEP 99 — runDocumentIngestionV2", () => {
  it("routes excel through hardened ingestion path", () => {
    const workbook = {
      Sheets: {
        Budget: [
          ["Visit", "Activity", "Cost", "Qty"],
          ["Screening", "Labs", 100, 1],
        ],
      },
    }

    const result = runDocumentIngestionV2({
      fileName: "budget.xlsx",
      workbook,
    })

    expect(result.summary.sourceType).toBe("excel")
    expect(result.summary.route).toBe("excel_hardened")
  })

  it("routes non-excel through legacy path", () => {
    const result = runDocumentIngestionV2({
      fileName: "contract.pdf",
      pdfPages: [{ text: "test" }],
    })

    expect(result.summary.route).toBe("legacy")
  })
})
