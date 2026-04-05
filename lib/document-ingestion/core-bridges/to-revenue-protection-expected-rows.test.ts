import { describe, expect, it } from "vitest"

import type { InitialExpectedBillableRow } from "./build-initial-expected-billables"
import { toRevenueProtectionExpectedRows } from "./to-revenue-protection-expected-rows"

function billable(
  partial: Partial<InitialExpectedBillableRow> & Pick<InitialExpectedBillableRow, "expectedBillableId">,
): InitialExpectedBillableRow {
  return {
    activityId: "act::0",
    visitName: "V",
    activityName: "A",
    quantity: 1,
    unitPrice: 10,
    expectedAmount: 10,
    sourceRecordIndex: 0,
    confidence: "high",
    generationStatus: "ready",
    generationWarnings: [],
    ...partial,
  }
}

describe("toRevenueProtectionExpectedRows", () => {
  it("clean row maps correctly", () => {
    const res = toRevenueProtectionExpectedRows({
      documentId: "d1",
      rows: [billable({ expectedBillableId: "exp::0" })],
    })
    expect(res.expectedRows[0]).toEqual({
      sourceRecordIndex: 0,
      visitName: "V",
      activityName: "A",
      quantity: 1,
      unitPrice: 10,
      totalPrice: 10,
      notes: null,
      confidence: "high",
      needsReview: false,
      reviewReasons: [],
    })
    expect(res.summary.readyCount).toBe(1)
    expect(res.warnings).toEqual([])
  })

  it("needs_review propagates to needsReview", () => {
    const res = toRevenueProtectionExpectedRows({
      documentId: null,
      rows: [
        billable({
          expectedBillableId: "exp::0",
          generationStatus: "needs_review",
          generationWarnings: ["x"],
        }),
      ],
    })
    expect(res.expectedRows[0].needsReview).toBe(true)
    expect(res.summary.needsReviewCount).toBe(1)
    expect(res.summary.readyCount).toBe(0)
    expect(res.warnings).toEqual([
      "Some expected rows require review before revenue protection matching.",
    ])
  })

  it("expectedAmount maps to totalPrice", () => {
    const res = toRevenueProtectionExpectedRows({
      documentId: null,
      rows: [billable({ expectedBillableId: "exp::0", expectedAmount: 250, unitPrice: 25, quantity: 10 })],
    })
    expect(res.expectedRows[0].totalPrice).toBe(250)
  })

  it("reviewReasons equals generationWarnings", () => {
    const res = toRevenueProtectionExpectedRows({
      documentId: null,
      rows: [
        billable({
          expectedBillableId: "exp::0",
          generationStatus: "needs_review",
          generationWarnings: ["Missing visitName", "Missing quantity"],
        }),
      ],
    })
    expect(res.expectedRows[0].reviewReasons).toEqual(["Missing visitName", "Missing quantity"])
  })

  it("summary counts correct for mixed rows", () => {
    const res = toRevenueProtectionExpectedRows({
      documentId: null,
      rows: [
        billable({ expectedBillableId: "e0", sourceRecordIndex: 0 }),
        billable({
          expectedBillableId: "e1",
          sourceRecordIndex: 1,
          visitName: null,
          generationStatus: "needs_review",
          generationWarnings: ["Missing visitName"],
        }),
        billable({
          expectedBillableId: "e2",
          sourceRecordIndex: 2,
          quantity: null,
          expectedAmount: null,
          generationStatus: "needs_review",
          generationWarnings: ["Missing quantity", "Missing expected amount"],
        }),
      ],
    })
    expect(res.summary.totalInputRows).toBe(3)
    expect(res.summary.totalExpectedRows).toBe(3)
    expect(res.summary.readyCount).toBe(1)
    expect(res.summary.needsReviewCount).toBe(2)
    expect(res.summary.missingVisitNameCount).toBe(1)
    expect(res.summary.missingQuantityCount).toBe(1)
    expect(res.summary.missingExpectedAmountCount).toBe(1)
  })

  it("empty input warning", () => {
    const res = toRevenueProtectionExpectedRows({ documentId: null, rows: [] })
    expect(res.expectedRows).toEqual([])
    expect(res.warnings).toEqual(["No initial expected billables provided."])
  })
})
