import { describe, expect, it } from "vitest"

import { runDownstreamCanonicalBridge } from "./run-downstream-canonical-bridge"

describe("STEP 91 — Downstream canonical bridge", () => {
  it("builds downstream bridge from accepted reentry payload", () => {
    const result = runDownstreamCanonicalBridge({
      reentryPayload: {
        data: {
          acceptedForReentry: true,
          records: [
            {
              recordType: "soa_activity",
              fields: {
                visitName: { value: "Screening", confidence: "high", humanReviewed: true },
                activityDescription: { value: "CBC", confidence: "high" },
                unitPrice: { value: "125", confidence: "high", humanReviewed: true },
              },
              trace: {
                sourceType: "pdf",
                pageNumber: 1,
              },
            },
            {
              recordType: "budget_line",
              fields: {
                category: { value: "Screening Fee", confidence: "high" },
                visitName: { value: "Screening", confidence: "high" },
                unitPrice: { value: "125", confidence: "high" },
              },
            },
            {
              recordType: "contract_clause",
              fields: {
                clauseType: { value: "payment_terms", confidence: "high" },
                clauseText: { value: "Sponsor will pay within 45 days.", confidence: "high" },
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
          ],
        },
        summary: {
          acceptedForReentry: true,
          totalRecords: 3,
          appliedCount: 1,
          status: "accepted",
        },
        warnings: [],
      },
    })

    expect(result.summary.status === "ready" || result.summary.status === "partial").toBe(true)
    expect(result.summary.soaRows).toBe(1)
    expect(result.summary.budgetRows).toBe(1)
    expect(result.summary.contractRows).toBe(1)
    expect(result.data.bridge.data.soa.rows[0]!.sourceTrace?.pageNumber).toBe(1)
  })

  it("blocks downstream bridge when reentry is not accepted", () => {
    const result = runDownstreamCanonicalBridge({
      reentryPayload: {
        data: {
          acceptedForReentry: false,
          records: [],
          appliedCorrections: [],
        },
        summary: {
          acceptedForReentry: false,
          totalRecords: 0,
          appliedCount: 0,
          status: "manual_review_required",
        },
        warnings: [],
      },
    })

    expect(result.summary.status).toBe("blocked")
    expect(result.data.enginePayloads.summary.soaRows).toBe(0)
  })
})
