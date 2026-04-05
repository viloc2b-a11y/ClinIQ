import { describe, expect, it } from "vitest"

import { runHumanResolutionMerge } from "./run-human-resolution-merge"

describe("STEP 89 — Human resolution merge", () => {
  it("applies approved corrections into corrected parse", () => {
    const result = runHumanResolutionMerge({
      payload: {
        reviewId: "review-pdf-manual_review_required-test",
        fileName: "test.pdf",
        sourceType: "pdf",
        corrections: [
          {
            recordIndex: 0,
            recordType: "soa_activity",
            fieldName: "visitName",
            originalValue: null,
            correctedValue: "Screening",
            decision: "approve",
            reviewerNote: "Confirmed from source document",
          },
          {
            recordIndex: 0,
            recordType: "soa_activity",
            fieldName: "unitPrice",
            originalValue: null,
            correctedValue: "125",
            decision: "approve",
          },
        ],
      },
      adaptedRecords: [
        {
          recordType: "soa_activity",
          fields: {
            visitName: { value: null, confidence: "low" },
            activityDescription: { value: "CBC", confidence: "medium" },
            unitPrice: { value: null, confidence: "low" },
          },
        },
      ],
    })

    expect(result.summary.valid).toBe(true)
    expect(result.summary.appliedCount).toBe(2)
    const visit = result.data.correctedParse?.data.records[0]!.fields.visitName as {
      value: unknown
    }
    expect(visit.value).toBe("Screening")
  })

  it("fails validation for invalid field correction", () => {
    const result = runHumanResolutionMerge({
      payload: {
        reviewId: "review-x",
        fileName: "x.pdf",
        sourceType: "pdf",
        corrections: [
          {
            recordIndex: 0,
            recordType: "soa_activity",
            fieldName: "nonexistentField",
            originalValue: null,
            correctedValue: "x",
            decision: "approve",
          },
        ],
      },
      adaptedRecords: [
        {
          recordType: "soa_activity",
          fields: {
            visitName: { value: null, confidence: "low" },
          },
        },
      ],
    })

    expect(result.summary.valid).toBe(false)
    expect(result.data.correctedParse).toBe(null)
  })
})
