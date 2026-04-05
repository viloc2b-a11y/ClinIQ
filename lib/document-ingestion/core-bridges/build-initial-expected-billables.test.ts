import { describe, expect, it } from "vitest"

import { buildInitialExpectedBillables } from "./build-initial-expected-billables"
import type { ClassifiedSoaActivity } from "./build-initial-expected-billables"

function classified(
  partial: Partial<ClassifiedSoaActivity> & Pick<ClassifiedSoaActivity, "activityId">,
): ClassifiedSoaActivity {
  return {
    visitName: "V",
    activityName: "A",
    quantity: 1,
    unitPrice: 10,
    totalPrice: 10,
    sourceRecordIndex: 0,
    confidence: "high",
    needsReview: false,
    classificationStatus: "classified",
    classificationReasons: [],
    ...partial,
  }
}

describe("buildInitialExpectedBillables", () => {
  it("clean classified activity -> ready row with expectedAmount", () => {
    const res = buildInitialExpectedBillables({
      documentId: "d1",
      activities: [classified({ activityId: "act::0", sourceRecordIndex: 0, quantity: 2, unitPrice: 15 })],
    })
    expect(res.rows).toHaveLength(1)
    expect(res.rows[0].expectedBillableId).toBe("exp::act::0")
    expect(res.rows[0].expectedAmount).toBe(30)
    expect(res.rows[0].generationStatus).toBe("ready")
    expect(res.rows[0].generationWarnings).toEqual([])
    expect(res.warnings).toEqual([])
  })

  it("missing quantity -> needs_review", () => {
    const res = buildInitialExpectedBillables({
      documentId: null,
      activities: [classified({ activityId: "act::0", quantity: null })],
    })
    expect(res.rows[0].generationStatus).toBe("needs_review")
    expect(res.rows[0].expectedAmount).toBeNull()
    expect(res.rows[0].generationWarnings).toContain("Missing quantity")
    expect(res.rows[0].generationWarnings).toContain("Missing expected amount")
  })

  it("missing unitPrice -> needs_review", () => {
    const res = buildInitialExpectedBillables({
      documentId: null,
      activities: [classified({ activityId: "act::0", unitPrice: null })],
    })
    expect(res.rows[0].generationStatus).toBe("needs_review")
    expect(res.rows[0].expectedAmount).toBeNull()
    expect(res.rows[0].generationWarnings).toContain("Missing unitPrice")
  })

  it("missing visitName -> needs_review", () => {
    const res = buildInitialExpectedBillables({
      documentId: null,
      activities: [classified({ activityId: "act::0", visitName: null })],
    })
    expect(res.rows[0].generationStatus).toBe("needs_review")
    expect(res.rows[0].generationWarnings).toContain("Missing visitName")
  })

  it("missing activityName -> needs_review", () => {
    const res = buildInitialExpectedBillables({
      documentId: null,
      activities: [classified({ activityId: "act::0", activityName: null })],
    })
    expect(res.rows[0].generationStatus).toBe("needs_review")
    expect(res.rows[0].generationWarnings).toContain("Missing activityName")
  })

  it("low confidence -> needs_review", () => {
    const res = buildInitialExpectedBillables({
      documentId: null,
      activities: [classified({ activityId: "act::0", confidence: "low" })],
    })
    expect(res.rows[0].generationStatus).toBe("needs_review")
    expect(res.rows[0].generationWarnings).toContain("Low confidence source")
  })

  it("upstream classificationReasons propagate in order before generation warnings", () => {
    const res = buildInitialExpectedBillables({
      documentId: null,
      activities: [
        classified({
          activityId: "act::0",
          classificationStatus: "needs_review",
          classificationReasons: ["Marked for review upstream", "Missing economics"],
          visitName: null,
        }),
      ],
    })
    expect(res.rows[0].generationWarnings[0]).toBe("Marked for review upstream")
    expect(res.rows[0].generationWarnings[1]).toBe("Missing economics")
    expect(res.rows[0].generationWarnings).toContain("Missing visitName")
    const idxVisit = res.rows[0].generationWarnings.indexOf("Missing visitName")
    expect(idxVisit).toBeGreaterThan(1)
  })

  it("deduplicates overlapping classification and generation warnings deterministically", () => {
    const res = buildInitialExpectedBillables({
      documentId: null,
      activities: [
        classified({
          activityId: "act::0",
          classificationStatus: "needs_review",
          classificationReasons: ["Missing visitName", "Low confidence source"],
          visitName: null,
          confidence: "low",
        }),
      ],
    })
    const w = res.rows[0].generationWarnings
    expect(w.filter((x) => x === "Missing visitName").length).toBe(1)
    expect(w.filter((x) => x === "Low confidence source").length).toBe(1)
  })

  it("summary counts correct", () => {
    const res = buildInitialExpectedBillables({
      documentId: null,
      activities: [
        classified({ activityId: "act::0", sourceRecordIndex: 0 }),
        classified({
          activityId: "act::1",
          sourceRecordIndex: 1,
          visitName: null,
          unitPrice: null,
        }),
        classified({
          activityId: "act::2",
          sourceRecordIndex: 2,
          quantity: null,
          confidence: "low",
        }),
      ],
    })
    expect(res.summary.totalActivities).toBe(3)
    expect(res.summary.totalRows).toBe(3)
    expect(res.summary.readyCount).toBe(1)
    expect(res.summary.needsReviewCount).toBe(2)
    expect(res.summary.missingVisitNameCount).toBe(1)
    expect(res.summary.missingActivityNameCount).toBe(0)
    expect(res.summary.missingUnitPriceCount).toBe(1)
    expect(res.summary.missingQuantityCount).toBe(1)
    expect(res.summary.missingExpectedAmountCount).toBeGreaterThanOrEqual(2)
    expect(res.summary.lowConfidenceCount).toBe(1)
  })

  it("empty input warning", () => {
    const res = buildInitialExpectedBillables({ documentId: null, activities: [] })
    expect(res.rows).toEqual([])
    expect(res.summary.totalActivities).toBe(0)
    expect(res.warnings).toEqual(["No classified SoA activities provided."])
  })
})
