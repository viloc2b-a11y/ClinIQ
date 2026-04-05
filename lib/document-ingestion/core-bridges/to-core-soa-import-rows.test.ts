import { describe, expect, it } from "vitest"

import type { PreSoaRow } from "../adapters/to-pre-soa-rows"
import { toCoreSoaImportRows } from "./to-core-soa-import-rows"

function row(partial: Partial<PreSoaRow> & Pick<PreSoaRow, "sourceRecordIndex">): PreSoaRow {
  return {
    visitName: null,
    activityName: null,
    quantity: null,
    unitPrice: null,
    totalPrice: null,
    notes: null,
    confidence: null,
    needsReview: false,
    reviewReasons: [],
    ...partial,
  }
}

describe("toCoreSoaImportRows", () => {
  it("ready row maps to importStatus ready", () => {
    const out = toCoreSoaImportRows({
      rows: [
        row({
          sourceRecordIndex: 0,
          visitName: "V1",
          activityName: "ECG",
          quantity: 1,
          unitPrice: 85,
          totalPrice: 85,
          needsReview: false,
        }),
      ],
    })
    expect(out.rows[0]!.importStatus).toBe("ready")
    expect(out.rows[0]!.importWarnings).toEqual([])
  })

  it("row needing review maps to needs_review", () => {
    const out = toCoreSoaImportRows({
      rows: [row({ sourceRecordIndex: 0, needsReview: true, reviewReasons: ["Missing visitName"] })],
    })
    expect(out.rows[0]!.importStatus).toBe("needs_review")
  })

  it("reviewReasons propagate to importWarnings", () => {
    const out = toCoreSoaImportRows({
      rows: [
        row({
          sourceRecordIndex: 0,
          needsReview: true,
          reviewReasons: ["Missing visitName", "Low confidence source"],
        }),
      ],
    })
    expect(out.rows[0]!.importWarnings).toEqual(["Missing visitName", "Low confidence source"])
  })

  it("summary counts correct", () => {
    const out = toCoreSoaImportRows({
      rows: [
        row({ sourceRecordIndex: 0, needsReview: false }),
        row({ sourceRecordIndex: 1, needsReview: true }),
        row({ sourceRecordIndex: 2, needsReview: true }),
      ],
    })
    expect(out.summary.totalInputRows).toBe(3)
    expect(out.summary.totalOutputRows).toBe(3)
    expect(out.summary.readyCount).toBe(1)
    expect(out.summary.needsReviewCount).toBe(2)
  })

  it("empty input returns warning", () => {
    const out = toCoreSoaImportRows({ rows: [] })
    expect(out.rows).toEqual([])
    expect(out.warnings).toEqual(["No pre-SoA rows provided."])
    expect(out.summary.readyCount).toBe(0)
    expect(out.summary.needsReviewCount).toBe(0)
  })
})
