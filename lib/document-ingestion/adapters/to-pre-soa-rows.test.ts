import { describe, expect, it } from "vitest"

import { toPreSoaRows } from "./to-pre-soa-rows"
import type { SoaCandidateRow } from "../bridge-document-records"

function c(partial: Partial<SoaCandidateRow> & Pick<SoaCandidateRow, "sourceRecordIndex">): SoaCandidateRow {
  return {
    visitName: null,
    activityName: null,
    quantity: null,
    unitPrice: null,
    totalPrice: null,
    notes: null,
    confidence: null,
    ...partial,
  }
}

describe("toPreSoaRows", () => {
  it("clean candidate with visit + activity + economics → needsReview false", () => {
    const out = toPreSoaRows({
      soaCandidates: [
        c({
          sourceRecordIndex: 0,
          visitName: "Visit 1",
          activityName: "Labs",
          unitPrice: 100,
          totalPrice: 200,
          confidence: "high",
        }),
      ],
    })
    expect(out.rows).toHaveLength(1)
    expect(out.rows[0]!.needsReview).toBe(false)
    expect(out.rows[0]!.reviewReasons).toEqual([])
    expect(out.warnings).toEqual([])
    expect(out.summary.rowsNeedingReview).toBe(0)
  })

  it("missing visitName → needsReview true and Missing visitName", () => {
    const out = toPreSoaRows({
      soaCandidates: [
        c({
          sourceRecordIndex: 0,
          visitName: null,
          activityName: "X",
          unitPrice: 1,
          totalPrice: 1,
        }),
      ],
    })
    expect(out.rows[0]!.needsReview).toBe(true)
    expect(out.rows[0]!.reviewReasons).toEqual(["Missing visitName"])
  })

  it("missing activityName → needsReview true and Missing activityName", () => {
    const out = toPreSoaRows({
      soaCandidates: [
        c({
          sourceRecordIndex: 0,
          visitName: "V1",
          activityName: null,
          unitPrice: 1,
          totalPrice: 1,
        }),
      ],
    })
    expect(out.rows[0]!.needsReview).toBe(true)
    expect(out.rows[0]!.reviewReasons).toEqual(["Missing activityName"])
  })

  it("missing economics → needsReview true and Missing economics", () => {
    const out = toPreSoaRows({
      soaCandidates: [
        c({
          sourceRecordIndex: 0,
          visitName: "V1",
          activityName: "Proc",
          unitPrice: null,
          totalPrice: null,
        }),
      ],
    })
    expect(out.rows[0]!.needsReview).toBe(true)
    expect(out.rows[0]!.reviewReasons).toEqual(["Missing economics"])
  })

  it("low confidence → needsReview true and Low confidence source", () => {
    const out = toPreSoaRows({
      soaCandidates: [
        c({
          sourceRecordIndex: 0,
          visitName: "V1",
          activityName: "Proc",
          unitPrice: 10,
          totalPrice: 10,
          confidence: "low",
        }),
      ],
    })
    expect(out.rows[0]!.needsReview).toBe(true)
    expect(out.rows[0]!.reviewReasons).toEqual(["Low confidence source"])
  })

  it("multiple mixed rows → summary counts correct", () => {
    const out = toPreSoaRows({
      soaCandidates: [
        c({
          sourceRecordIndex: 0,
          visitName: "V1",
          activityName: "A",
          unitPrice: 1,
          totalPrice: 1,
        }),
        c({
          sourceRecordIndex: 1,
          visitName: null,
          activityName: "B",
          unitPrice: 2,
          totalPrice: 2,
        }),
        c({
          sourceRecordIndex: 2,
          visitName: "V2",
          activityName: null,
          unitPrice: null,
          totalPrice: null,
        }),
        c({
          sourceRecordIndex: 3,
          visitName: "V3",
          activityName: "D",
          unitPrice: 1,
          totalPrice: null,
          confidence: "low",
        }),
      ],
    })
    expect(out.summary.totalInputCandidates).toBe(4)
    expect(out.summary.totalRows).toBe(4)
    expect(out.summary.rowsNeedingReview).toBe(3)
    expect(out.summary.missingVisitName).toBe(1)
    expect(out.summary.missingActivityName).toBe(1)
    expect(out.summary.missingEconomics).toBe(1)
    expect(out.rows[0]!.needsReview).toBe(false)
    expect(out.rows[2]!.reviewReasons).toEqual(["Missing activityName", "Missing economics"])
    expect(out.rows[3]!.reviewReasons).toEqual(["Low confidence source"])
    expect(out.warnings).toContain("More than half of pre-SoA rows are flagged for review.")
  })

  it("empty input → zero rows and warning emitted", () => {
    const out = toPreSoaRows({ soaCandidates: [] })
    expect(out.rows).toEqual([])
    expect(out.summary.totalInputCandidates).toBe(0)
    expect(out.summary.totalRows).toBe(0)
    expect(out.summary.rowsNeedingReview).toBe(0)
    expect(out.warnings).toEqual(["No SoA activity candidates were provided."])
  })
})
