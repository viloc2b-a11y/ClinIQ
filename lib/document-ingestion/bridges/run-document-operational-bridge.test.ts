import { describe, expect, it } from "vitest"

import { runDocumentOperationalBridge } from "./run-document-operational-bridge"

describe("STEP 100 — runDocumentOperationalBridge", () => {
  it("bridges excel hardened ingestion into document chain input", () => {
    const workbook = {
      Sheets: {
        Schedule: [
          ["Visit", "Procedure", "Fee", "Qty"],
          ["Screening", "CBC", 125, 1],
        ],
      },
    }

    const result = runDocumentOperationalBridge({
      fileName: "demo.xlsx",
      workbook,
    })

    expect(result.summary.sourceType).toBe("excel")
    expect(result.summary.route).toBe("excel_hardened")
  })
})
