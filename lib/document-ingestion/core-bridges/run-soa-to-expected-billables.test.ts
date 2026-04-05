import { describe, expect, it } from "vitest"

import { runSoaToExpectedBillables } from "./run-soa-to-expected-billables"
import type { CoreSoaStructuredActivity } from "./to-core-soa-structured-input"

function act(
  partial: Partial<CoreSoaStructuredActivity> & Pick<CoreSoaStructuredActivity, "activityId">,
): CoreSoaStructuredActivity {
  return {
    visitName: "V",
    activityName: "A",
    quantity: 1,
    unitPrice: 10,
    totalPrice: 10,
    sourceRecordIndex: 0,
    confidence: "high",
    needsReview: false,
    ...partial,
  }
}

describe("runSoaToExpectedBillables", () => {
  it("clean activity flow: one classified ready billable", async () => {
    const out = await runSoaToExpectedBillables({
      documentId: "d1",
      activities: [act({ activityId: "act::0", sourceRecordIndex: 0 })],
    })
    expect(out.summary.totalActivities).toBe(1)
    expect(out.summary.classifiedCount).toBe(1)
    expect(out.summary.needsReviewClassificationCount).toBe(0)
    expect(out.summary.expectedBillableCount).toBe(1)
    expect(out.summary.readyExpectedBillableCount).toBe(1)
    expect(out.summary.needsReviewExpectedBillableCount).toBe(0)
    expect(out.classification.activities[0].classificationStatus).toBe("classified")
    expect(out.expectedBillables.rows[0].generationStatus).toBe("ready")
  })

  it("upstream needsReview: classification and billable need review", async () => {
    const out = await runSoaToExpectedBillables({
      documentId: null,
      activities: [act({ activityId: "act::0", needsReview: true })],
    })
    expect(out.classification.activities[0].classificationStatus).toBe("needs_review")
    expect(out.expectedBillables.rows[0].generationStatus).toBe("needs_review")
    expect(out.summary.needsReviewClassificationCount).toBe(1)
    expect(out.summary.needsReviewExpectedBillableCount).toBe(1)
  })

  it("missing quantity only: may stay classified; billable needs_review and expectedAmount null", async () => {
    const out = await runSoaToExpectedBillables({
      documentId: null,
      activities: [
        act({
          activityId: "act::0",
          quantity: null,
          unitPrice: 5,
          totalPrice: 5,
        }),
      ],
    })
    expect(out.classification.activities[0].classificationStatus).toBe("classified")
    expect(out.expectedBillables.rows[0].generationStatus).toBe("needs_review")
    expect(out.expectedBillables.rows[0].expectedAmount).toBeNull()
    expect(out.expectedBillables.rows[0].generationWarnings).toContain("Missing quantity")
  })

  it("low confidence: both layers need_review", async () => {
    const out = await runSoaToExpectedBillables({
      documentId: null,
      activities: [act({ activityId: "act::0", confidence: "low" })],
    })
    expect(out.classification.activities[0].classificationStatus).toBe("needs_review")
    expect(out.expectedBillables.rows[0].generationStatus).toBe("needs_review")
  })

  it("mixed four activities: summary and both layers consistent", async () => {
    const out = await runSoaToExpectedBillables({
      documentId: "mix",
      activities: [
        act({ activityId: "act::0", sourceRecordIndex: 0 }),
        act({ activityId: "act::1", sourceRecordIndex: 1, visitName: null }),
        act({ activityId: "act::2", sourceRecordIndex: 2, confidence: "low" }),
        act({ activityId: "act::3", sourceRecordIndex: 3, unitPrice: null, quantity: 1, totalPrice: 100 }),
      ],
    })
    expect(out.summary.totalActivities).toBe(4)
    expect(out.summary.classifiedCount).toBe(2)
    expect(out.summary.needsReviewClassificationCount).toBe(2)
    expect(out.summary.expectedBillableCount).toBe(4)
    expect(out.summary.readyExpectedBillableCount).toBe(1)
    expect(out.summary.needsReviewExpectedBillableCount).toBe(3)
    expect(out.classification.activities).toHaveLength(4)
    expect(out.expectedBillables.rows).toHaveLength(4)
  })

  it("warnings: classification first, then expected billables, deduped", async () => {
    const out = await runSoaToExpectedBillables({ documentId: null, activities: [] })
    expect(out.warnings[0]).toBe("No SoA activities provided for classification.")
    expect(out.warnings[1]).toBe("No classified SoA activities provided.")
    expect(new Set(out.warnings).size).toBe(out.warnings.length)
  })
})
