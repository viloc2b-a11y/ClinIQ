import { describe, expect, it } from "vitest"

import type { ClaimsLedgerRow } from "../claims/types"
import {
  buildExecutionLineFromClaimsLedgerRow,
  buildExecutionLinesFromClaimsLedger,
} from "./execution-line-builder"

function baseRow(
  overrides: Partial<ClaimsLedgerRow> &
    Pick<ClaimsLedgerRow, "lineCode" | "amount" | "eventDate">,
): ClaimsLedgerRow {
  return {
    studyId: "S-1",
    label: "L",
    approved: true,
    supportDocumentationComplete: true,
    billableInstanceId: "bill-x",
    eventLogId: "evt-x",
    ...overrides,
  }
}

describe("execution-line-builder", () => {
  it("happy path → invoiceable, auto eligible, no blockers", () => {
    const line = buildExecutionLineFromClaimsLedgerRow(
      baseRow({
        lineCode: "V1",
        amount: 200,
        eventDate: "2026-01-01T12:00:00.000Z",
        billableInstanceId: "b1",
        eventLogId: "e1",
        siteId: "site-1",
        sponsorId: "sp-1",
        visitName: "Week 1",
        activityId: "ACT-1",
        feeCode: "FEE-1",
        quantity: 2,
        unitPrice: 100,
      }),
    )
    expect(line.status).toBe("invoiceable")
    expect(line.blockingCodes).toEqual([])
    expect(line.autoInvoiceEligible).toBe(true)
    expect(line.evidenceStatus).toBe("complete")
    expect(line.approvalStatus).toBe("approved")
    expect(line.disputeStatus).toBe("none")
    expect(line.quantity).toBe(2)
    expect(line.unitPrice).toBe(100)
    expect(line.amount).toBe(200)
    expect(line.siteId).toBe("site-1")
    expect(line.feeCode).toBe("FEE-1")
    expect(line.eventDate).toBe("2026-01-01T12:00:00.000Z")
  })

  it("missing docs → NO_DOC, blocked", () => {
    const line = buildExecutionLineFromClaimsLedgerRow(
      baseRow({
        lineCode: "X",
        amount: 50,
        eventDate: "2026-01-02T12:00:00.000Z",
        supportDocumentationComplete: false,
      }),
    )
    expect(line.evidenceStatus).toBe("missing")
    expect(line.blockingCodes).toContain("NO_DOC")
    expect(line.blockingMessages.some((m) => m.includes("documentation"))).toBe(
      true,
    )
    expect(line.status).toBe("blocked")
    expect(line.autoInvoiceEligible).toBe(false)
  })

  it("not approved → NOT_APPROVED, blocked", () => {
    const line = buildExecutionLineFromClaimsLedgerRow(
      baseRow({
        lineCode: "Y",
        amount: 50,
        eventDate: "2026-01-03T12:00:00.000Z",
        approved: false,
      }),
    )
    expect(line.approvalStatus).toBe("pending")
    expect(line.blockingCodes).toContain("NOT_APPROVED")
    expect(line.status).toBe("blocked")
    expect(line.autoInvoiceEligible).toBe(false)
  })

  it("disputed → DISPUTED, status disputed", () => {
    const line = buildExecutionLineFromClaimsLedgerRow(
      baseRow({
        lineCode: "D",
        amount: 60,
        eventDate: "2026-01-04T12:00:00.000Z",
        disputed: true,
        disputeReason: "Sponsor dispute",
      }),
    )
    expect(line.disputeStatus).toBe("open")
    expect(line.blockingCodes).toContain("DISPUTED")
    expect(line.status).toBe("disputed")
    expect(line.disputeReason).toBe("Sponsor dispute")
    expect(
      line.blockingMessages[line.blockingCodes.indexOf("DISPUTED")],
    ).toBe("Sponsor dispute")
    expect(line.autoInvoiceEligible).toBe(false)
  })

  it("non-matching → NON_MATCH, dispute open, status disputed", () => {
    const line = buildExecutionLineFromClaimsLedgerRow(
      baseRow({
        lineCode: "NM",
        amount: 70,
        eventDate: "2026-01-05T12:00:00.000Z",
        nonMatching: true,
        nonMatchingReason: "Grid mismatch",
      }),
    )
    expect(line.disputeStatus).toBe("open")
    expect(line.blockingCodes).toContain("NON_MATCH")
    expect(line.status).toBe("disputed")
    expect(line.disputeReason).toBe("Grid mismatch")
    expect(line.autoInvoiceEligible).toBe(false)
  })

  it("zero amount → ZERO_AMOUNT first, unitPrice 0", () => {
    const line = buildExecutionLineFromClaimsLedgerRow(
      baseRow({
        lineCode: "Z",
        amount: 0,
        eventDate: "2026-01-06T12:00:00.000Z",
        quantity: 2,
      }),
    )
    expect(line.blockingCodes[0]).toBe("ZERO_AMOUNT")
    expect(line.amount).toBe(0)
    expect(line.unitPrice).toBe(0)
    expect(line.status).toBe("blocked")
    expect(line.autoInvoiceEligible).toBe(false)
  })

  it("overdue → OVERDUE_REVIEW", () => {
    const line = buildExecutionLineFromClaimsLedgerRow(
      baseRow({
        lineCode: "O",
        amount: 80,
        eventDate: "2026-01-07T12:00:00.000Z",
        markedOverdue: true,
      }),
    )
    expect(line.blockingCodes).toContain("OVERDUE_REVIEW")
    expect(line.status).toBe("blocked")
    expect(line.autoInvoiceEligible).toBe(false)
  })

  it("combined blockers: dispute precedence for status", () => {
    const line = buildExecutionLineFromClaimsLedgerRow(
      baseRow({
        lineCode: "C",
        amount: 100,
        eventDate: "2026-01-08T12:00:00.000Z",
        disputed: true,
        disputeReason: "Hold",
        approved: false,
        supportDocumentationComplete: false,
      }),
    )
    expect(line.status).toBe("disputed")
    expect(line.blockingCodes).toEqual([
      "DISPUTED",
      "NOT_APPROVED",
      "NO_DOC",
    ])
    expect(line.autoInvoiceEligible).toBe(false)
  })

  it("buildExecutionLinesFromClaimsLedger maps array", () => {
    const rows = [
      baseRow({
        lineCode: "A",
        amount: 1,
        eventDate: "2026-01-01T12:00:00.000Z",
      }),
    ]
    const out = buildExecutionLinesFromClaimsLedger(rows)
    expect(out).toHaveLength(1)
    expect(out[0].lineCode).toBe("A")
  })

  it("unitPrice derived from amount / quantity when unitPrice omitted", () => {
    const line = buildExecutionLineFromClaimsLedgerRow(
      baseRow({
        lineCode: "Q",
        amount: 300,
        eventDate: "2026-01-09T12:00:00.000Z",
        quantity: 3,
      }),
    )
    expect(line.unitPrice).toBe(100)
  })
})
