import { describe, expect, it } from "vitest"

import type { CoreSoaImportRow } from "./to-core-soa-import-rows"
import { toCoreSoaStructuredInput } from "./to-core-soa-structured-input"

function row(
  partial: Partial<CoreSoaImportRow> & Pick<CoreSoaImportRow, "sourceRecordIndex">,
): CoreSoaImportRow {
  return {
    visitName: null,
    activityName: null,
    quantity: null,
    unitPrice: null,
    totalPrice: null,
    notes: null,
    confidence: null,
    importStatus: "ready",
    importWarnings: [],
    ...partial,
  }
}

describe("toCoreSoaStructuredInput", () => {
  it("maps each row to one activity with fields pass-through", () => {
    const rows = [
      row({
        sourceRecordIndex: 0,
        visitName: "V1",
        activityName: "Labs",
        quantity: 2,
        unitPrice: 10,
        totalPrice: 20,
        confidence: "high",
      }),
    ]
    const out = toCoreSoaStructuredInput({ documentId: "d1", rows })
    expect(out.activities).toHaveLength(1)
    expect(out.activities[0]).toEqual({
      activityId: "act::0",
      visitName: "V1",
      activityName: "Labs",
      quantity: 2,
      unitPrice: 10,
      totalPrice: 20,
      sourceRecordIndex: 0,
      confidence: "high",
      needsReview: false,
    })
    expect(out.documentId).toBe("d1")
    expect(out.warnings).toEqual([])
  })

  it("propagates needsReview from importStatus needs_review", () => {
    const out = toCoreSoaStructuredInput({
      documentId: null,
      rows: [row({ sourceRecordIndex: 5, importStatus: "needs_review" })],
    })
    expect(out.activities[0].needsReview).toBe(true)
    expect(out.summary.needsReviewActivities).toBe(1)
    expect(out.summary.readyActivities).toBe(0)
    expect(out.warnings).toEqual(["Some SoA activities require review."])
  })

  it("activityId is deterministic act::sourceRecordIndex", () => {
    const out = toCoreSoaStructuredInput({
      documentId: null,
      rows: [row({ sourceRecordIndex: 42 })],
    })
    expect(out.activities[0].activityId).toBe("act::42")
  })

  it("summary counts match partition", () => {
    const out = toCoreSoaStructuredInput({
      documentId: null,
      rows: [
        row({ sourceRecordIndex: 0, importStatus: "ready" }),
        row({ sourceRecordIndex: 1, importStatus: "needs_review" }),
        row({ sourceRecordIndex: 2, importStatus: "ready" }),
      ],
    })
    expect(out.summary.totalActivities).toBe(3)
    expect(out.summary.readyActivities).toBe(2)
    expect(out.summary.needsReviewActivities).toBe(1)
  })

  it("empty input: warning and empty activities", () => {
    const out = toCoreSoaStructuredInput({ documentId: null, rows: [] })
    expect(out.activities).toEqual([])
    expect(out.summary.totalActivities).toBe(0)
    expect(out.warnings).toEqual(["No SoA structured input generated."])
  })
})
