import { describe, expect, it } from "vitest"

import { runCorrectedReentryGate } from "./run-corrected-reentry-gate"

describe("STEP 90 — Corrected re-entry gate", () => {
  it("accepts corrected parse with approved human-reviewed fields", () => {
    const result = runCorrectedReentryGate({
      correctedParse: {
        data: {
          sourceType: "pdf",
          fileName: "soa.pdf",
          records: [
            {
              recordType: "soa_activity",
              fields: {
                visitName: {
                  value: "Screening",
                  confidence: "high",
                  humanReviewed: true,
                },
                activityDescription: {
                  value: "CBC",
                  confidence: "high",
                },
                unitPrice: {
                  value: "125",
                  confidence: "high",
                  humanReviewed: true,
                },
              },
            },
          ],
          appliedCorrections: [
            {
              recordIndex: 0,
              fieldName: "visitName",
              correctedValue: "Screening",
              applied: true,
            },
            {
              recordIndex: 0,
              fieldName: "unitPrice",
              correctedValue: "125",
              applied: true,
            },
          ],
        },
        summary: {
          sourceType: "pdf",
          totalRecords: 1,
          appliedCount: 2,
        },
      },
    })

    expect(result.summary.canReenter).toBe(true)
    expect(
      result.summary.status === "accepted" ||
        result.summary.status === "accepted_with_warnings",
    ).toBe(true)
  })

  it("keeps corrected parse blocked if required fields still missing", () => {
    const result = runCorrectedReentryGate({
      correctedParse: {
        data: {
          sourceType: "pdf",
          fileName: "soa.pdf",
          records: [
            {
              recordType: "soa_activity",
              fields: {
                visitName: {
                  value: null,
                  confidence: "low",
                },
                activityDescription: {
                  value: "CBC",
                  confidence: "high",
                },
                unitPrice: {
                  value: null,
                  confidence: "low",
                },
              },
            },
          ],
          appliedCorrections: [],
        },
        summary: {
          sourceType: "pdf",
          totalRecords: 1,
          appliedCount: 0,
        },
      },
    })

    expect(result.summary.canReenter).toBe(false)
    expect(
      result.summary.status === "manual_review_required" ||
        result.summary.status === "rejected",
    ).toBe(true)
  })
})
