import { describe, expect, it } from "vitest"

import { classifyCoreSoaActivities } from "./classify-core-soa-activities"
import type { CoreSoaStructuredActivity } from "./to-core-soa-structured-input"

function act(partial: Partial<CoreSoaStructuredActivity> & Pick<CoreSoaStructuredActivity, "activityId">): CoreSoaStructuredActivity {
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

describe("classifyCoreSoaActivities", () => {
  it("clean activity -> classified", () => {
    const res = classifyCoreSoaActivities({
      documentId: "d1",
      activities: [act({ activityId: "act::0", sourceRecordIndex: 0 })],
    })
    expect(res.activities[0].classificationStatus).toBe("classified")
    expect(res.activities[0].classificationReasons).toEqual([])
  })

  it("upstream needsReview -> needs_review", () => {
    const res = classifyCoreSoaActivities({
      documentId: null,
      activities: [act({ activityId: "act::0", needsReview: true })],
    })
    expect(res.activities[0].classificationStatus).toBe("needs_review")
    expect(res.activities[0].classificationReasons).toEqual(["Marked for review upstream"])
  })

  it("missing visit -> needs_review", () => {
    const res = classifyCoreSoaActivities({
      documentId: null,
      activities: [act({ activityId: "act::0", visitName: null })],
    })
    expect(res.activities[0].classificationReasons).toContain("Missing visitName")
    expect(res.activities[0].classificationStatus).toBe("needs_review")
  })

  it("missing activity -> needs_review", () => {
    const res = classifyCoreSoaActivities({
      documentId: null,
      activities: [act({ activityId: "act::0", activityName: null })],
    })
    expect(res.activities[0].classificationReasons).toContain("Missing activityName")
    expect(res.activities[0].classificationStatus).toBe("needs_review")
  })

  it("missing economics (all three null) -> needs_review", () => {
    const res = classifyCoreSoaActivities({
      documentId: null,
      activities: [
        act({
          activityId: "act::0",
          quantity: null,
          unitPrice: null,
          totalPrice: null,
        }),
      ],
    })
    expect(res.activities[0].classificationReasons).toContain("Missing economics")
    expect(res.activities[0].classificationStatus).toBe("needs_review")
  })

  it("low confidence -> needs_review", () => {
    const res = classifyCoreSoaActivities({
      documentId: null,
      activities: [act({ activityId: "act::0", confidence: "low" })],
    })
    expect(res.activities[0].classificationReasons).toContain("Low confidence source")
    expect(res.activities[0].classificationStatus).toBe("needs_review")
  })

  it("summary counts correct", () => {
    const res = classifyCoreSoaActivities({
      documentId: null,
      activities: [
        act({ activityId: "act::0" }),
        act({
          activityId: "act::1",
          sourceRecordIndex: 1,
          visitName: null,
          confidence: "low",
        }),
        act({
          activityId: "act::2",
          sourceRecordIndex: 2,
          activityName: null,
          quantity: null,
          unitPrice: null,
          totalPrice: null,
        }),
      ],
    })
    expect(res.summary.totalActivities).toBe(3)
    expect(res.summary.classifiedCount).toBe(1)
    expect(res.summary.needsReviewCount).toBe(2)
    expect(res.summary.missingVisitNameCount).toBe(1)
    expect(res.summary.missingActivityNameCount).toBe(1)
    expect(res.summary.missingEconomicsCount).toBe(1)
    expect(res.summary.lowConfidenceCount).toBe(1)
  })

  it("empty input warning", () => {
    const res = classifyCoreSoaActivities({ documentId: null, activities: [] })
    expect(res.activities).toEqual([])
    expect(res.summary.totalActivities).toBe(0)
    expect(res.warnings).toEqual(["No SoA activities provided for classification."])
  })

  it("multiple reasons in deterministic order", () => {
    const res = classifyCoreSoaActivities({
      documentId: null,
      activities: [
        act({
          activityId: "act::0",
          needsReview: true,
          visitName: null,
          activityName: null,
          quantity: null,
          unitPrice: null,
          totalPrice: null,
          confidence: "low",
        }),
      ],
    })
    expect(res.activities[0].classificationReasons).toEqual([
      "Marked for review upstream",
      "Missing visitName",
      "Missing activityName",
      "Missing economics",
      "Low confidence source",
    ])
  })
})
