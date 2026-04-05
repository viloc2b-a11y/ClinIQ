import { describe, expect, it } from "vitest"

import { demoSoaImportRows } from "./fixtures/soa-to-expected-demo"
import { runSoaToExpectedBillables } from "./run-soa-to-expected-billables"
import { toCoreSoaIntakePayload } from "./to-core-soa-intake-payload"
import { toCoreSoaStructuredInput } from "./to-core-soa-structured-input"

describe("runSoaToExpectedBillables demo pipeline", () => {
  it("runs intake → structured → expected billables on demo fixture", async () => {
    const intake = toCoreSoaIntakePayload({
      documentId: "demo-soa-doc",
      rows: demoSoaImportRows,
    })
    const structured = toCoreSoaStructuredInput({
      documentId: intake.documentId,
      rows: intake.rows,
    })
    const result = await runSoaToExpectedBillables({
      documentId: structured.documentId,
      activities: structured.activities,
    })

    expect(intake.summary.totalRows).toBeGreaterThan(0)
    expect(structured.summary.totalActivities).toBeGreaterThan(0)
    expect(result.summary.expectedBillableCount).toBeGreaterThan(0)
    expect(result.summary.needsReviewExpectedBillableCount).toBeGreaterThan(0)
  })
})
