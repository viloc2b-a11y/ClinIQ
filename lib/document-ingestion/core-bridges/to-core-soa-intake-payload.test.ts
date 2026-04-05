import { describe, expect, it } from "vitest"

import { toCoreSoaIntakePayload } from "./to-core-soa-intake-payload"
import type { CoreSoaImportRow } from "./to-core-soa-import-rows"

function row(partial: Partial<CoreSoaImportRow> & Pick<CoreSoaImportRow, "sourceRecordIndex">): CoreSoaImportRow {
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

describe("toCoreSoaIntakePayload", () => {
  it("empty input: documentId null when omitted, zero rows, warning emitted", () => {
    const out = toCoreSoaIntakePayload({ rows: [] })
    expect(out.documentId).toBeNull()
    expect(out.rows).toEqual([])
    expect(out.readyRows).toEqual([])
    expect(out.rowsNeedingReview).toEqual([])
    expect(out.summary.totalRows).toBe(0)
    expect(out.summary.readyCount).toBe(0)
    expect(out.summary.needsReviewCount).toBe(0)
    expect(out.warnings).toEqual(["No SoA import rows provided."])
  })

  it("all ready rows: partition and needsReviewCount = 0", () => {
    const rows = [
      row({ sourceRecordIndex: 0, visitName: "V1", activityName: "A", importStatus: "ready" }),
      row({ sourceRecordIndex: 1, visitName: "V2", activityName: "B", importStatus: "ready" }),
    ]
    const out = toCoreSoaIntakePayload({ documentId: "d1", rows })
    expect(out.readyRows).toHaveLength(2)
    expect(out.rowsNeedingReview).toEqual([])
    expect(out.summary.totalRows).toBe(2)
    expect(out.summary.readyCount).toBe(2)
    expect(out.summary.needsReviewCount).toBe(0)
    expect(out.warnings).toEqual([])
  })

  it("mixed rows: partition and summary counts", () => {
    const rows = [
      row({ sourceRecordIndex: 0, importStatus: "ready" }),
      row({ sourceRecordIndex: 1, importStatus: "needs_review" }),
      row({ sourceRecordIndex: 2, importStatus: "ready" }),
    ]
    const out = toCoreSoaIntakePayload({ rows })
    expect(out.readyRows).toHaveLength(2)
    expect(out.rowsNeedingReview).toHaveLength(1)
    expect(out.summary.totalRows).toBe(3)
    expect(out.summary.readyCount).toBe(2)
    expect(out.summary.needsReviewCount).toBe(1)
    expect(out.warnings).toEqual(["Some SoA intake rows require review."])
  })

  it("derived missing visit / activity / economics counts", () => {
    const rows: CoreSoaImportRow[] = [
      row({
        sourceRecordIndex: 0,
        visitName: null,
        activityName: "Act",
        unitPrice: 1,
        totalPrice: 1,
      }),
      row({
        sourceRecordIndex: 1,
        visitName: "V",
        activityName: null,
        unitPrice: 1,
        totalPrice: 1,
      }),
      row({
        sourceRecordIndex: 2,
        visitName: "V",
        activityName: "A",
        unitPrice: null,
        totalPrice: null,
      }),
      row({
        sourceRecordIndex: 3,
        visitName: "V",
        activityName: "A",
        unitPrice: 1,
        totalPrice: 2,
        importWarnings: ["Missing visitName"],
      }),
      row({
        sourceRecordIndex: 4,
        visitName: "V",
        activityName: "A",
        unitPrice: 1,
        totalPrice: 2,
        importWarnings: ["Missing activityName"],
      }),
      row({
        sourceRecordIndex: 5,
        visitName: "V",
        activityName: "A",
        unitPrice: 1,
        totalPrice: 2,
        importWarnings: ["Missing economics"],
      }),
    ]
    const out = toCoreSoaIntakePayload({ rows })
    expect(out.summary.missingVisitNameCount).toBe(2)
    expect(out.summary.missingActivityNameCount).toBe(2)
    expect(out.summary.missingEconomicsCount).toBe(2)
  })

  it("lowConfidenceCount from confidence and warnings", () => {
    const rows: CoreSoaImportRow[] = [
      row({ sourceRecordIndex: 0, confidence: "low" }),
      row({ sourceRecordIndex: 1, confidence: "high" }),
      row({
        sourceRecordIndex: 2,
        confidence: "high",
        importWarnings: ["Low confidence source"],
      }),
    ]
    const out = toCoreSoaIntakePayload({ rows })
    expect(out.summary.lowConfidenceCount).toBe(2)
  })

  it("documentId passes through when provided", () => {
    const out = toCoreSoaIntakePayload({
      documentId: "doc-xyz",
      rows: [row({ sourceRecordIndex: 0 })],
    })
    expect(out.documentId).toBe("doc-xyz")
  })
})
