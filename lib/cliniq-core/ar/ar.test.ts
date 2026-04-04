import { describe, expect, it } from "vitest"

import type { InvoicePackage } from "../claims/types"
import {
  buildArAgingByDueDate,
  buildInvoiceBalanceView,
  buildSponsorArRollup,
  buildUnappliedCashView,
  computeInvoiceArStatus,
  computePostedInvoiceLineBalances,
  paymentUnappliedBalance,
  postInvoiceFromPackage,
  stableInvoiceId,
} from "./index"

function samplePackage(): InvoicePackage {
  return {
    schemaVersion: "1.0",
    studyId: "study-a",
    sponsorId: "sponsor-x",
    invoicePeriodStart: "2026-01-01",
    invoicePeriodEnd: "2026-01-31",
    generatedAt: "2026-02-01T12:00:00Z",
    lines: [
      {
        id: "il-1",
        studyId: "study-a",
        sponsorId: "sponsor-x",
        eventDate: "2026-01-10",
        lineCode: "L1",
        label: "Visit 1",
        amount: 60,
        status: "ready",
        claimItemId: "ci-1",
      },
      {
        id: "il-2",
        studyId: "study-a",
        sponsorId: "sponsor-x",
        eventDate: "2026-01-20",
        lineCode: "L2",
        label: "Visit 2",
        amount: 40,
        status: "ready",
        claimItemId: "ci-2",
      },
    ],
    subtotal: 100,
    lineCount: 2,
    hasBlockingIssues: false,
  }
}

describe("postInvoiceFromPackage", () => {
  it("assigns stable invoiceId and line ids with claimItemId preserved", () => {
    const pkg = samplePackage()
    const posted = postInvoiceFromPackage(pkg, { dueDate: "2026-02-15" })
    expect(posted.invoiceTotal).toBe(100)
    expect(posted.lines).toHaveLength(2)
    expect(posted.lines[0].claimItemId).toBe("ci-1")
    expect(posted.lines[1].claimItemId).toBe("ci-2")
    expect(posted.lines[0].invoiceLineId).toBeTruthy()
    expect(posted.lines[0].invoiceLineId).not.toBe(posted.lines[1].invoiceLineId)

    const again = postInvoiceFromPackage(pkg, { dueDate: "2026-02-15" })
    expect(again.invoiceId).toBe(posted.invoiceId)
    expect(again.lines.map((l) => l.invoiceLineId)).toEqual(
      posted.lines.map((l) => l.invoiceLineId),
    )
  })

  it("defaults dueDate from invoice period end", () => {
    const posted = postInvoiceFromPackage(samplePackage())
    expect(posted.dueDate).toBe("2026-01-31")
  })
})

describe("stableInvoiceId", () => {
  it("is deterministic for sorted claim ids", () => {
    const pkg = samplePackage()
    const a = stableInvoiceId({
      studyId: pkg.studyId,
      sponsorId: pkg.sponsorId,
      invoicePeriodStart: pkg.invoicePeriodStart,
      invoicePeriodEnd: pkg.invoicePeriodEnd,
      generatedAt: pkg.generatedAt,
      subtotal: pkg.subtotal,
      lineClaimItemIdsSorted: ["ci-1", "ci-2"],
    })
    const b = stableInvoiceId({
      studyId: pkg.studyId,
      sponsorId: pkg.sponsorId,
      invoicePeriodStart: pkg.invoicePeriodStart,
      invoicePeriodEnd: pkg.invoicePeriodEnd,
      generatedAt: pkg.generatedAt,
      subtotal: pkg.subtotal,
      lineClaimItemIdsSorted: ["ci-2", "ci-1"],
    })
    expect(a).not.toBe(b)
  })
})

describe("computeInvoiceArStatus (hardened semantics)", () => {
  const alloc = (
    inv: ReturnType<typeof postInvoiceFromPackage>,
    amount: number,
    lineId?: string,
  ) => ({
    allocationId: `a-${amount}`,
    paymentId: "p1",
    invoiceId: inv.invoiceId,
    ...(lineId ? { invoiceLineId: lineId } : {}),
    amount,
  })

  it("overdue: open balance > 0 and asOf past due (independent of short/partial labels)", () => {
    const inv = postInvoiceFromPackage(samplePackage(), { dueDate: "2026-01-10" })
    const asOf = "2026-01-20"
    const none = computeInvoiceArStatus(inv, [], [], asOf)
    expect(none.invoiceOpenBalance).toBe(100)
    expect(none.overdue).toBe(true)
    expect(none.paid).toBe(false)
    expect(none.partiallyPaid).toBe(false)
    expect(none.shortPaid).toBe(false)
  })

  it("partial payment before due => partially_paid, not short_paid", () => {
    const inv = postInvoiceFromPackage(samplePackage(), { dueDate: "2026-02-15" })
    const asOf = "2026-01-20"
    const st = computeInvoiceArStatus(
      inv,
      [alloc(inv, 30, inv.lines[0].invoiceLineId)],
      [],
      asOf,
    )
    expect(st.invoiceOpenBalance).toBe(70)
    expect(st.partiallyPaid).toBe(true)
    expect(st.shortPaid).toBe(false)
    expect(st.overdue).toBe(false)
  })

  it("partial payment after due with no write-off => short_paid, not partially_paid", () => {
    const inv = postInvoiceFromPackage(samplePackage(), { dueDate: "2026-01-10" })
    const asOf = "2026-01-20"
    const st = computeInvoiceArStatus(
      inv,
      [alloc(inv, 30, inv.lines[0].invoiceLineId)],
      [],
      asOf,
    )
    expect(st.invoiceOpenBalance).toBe(70)
    expect(st.shortPaid).toBe(true)
    expect(st.partiallyPaid).toBe(false)
    expect(st.overdue).toBe(true)
  })

  it("settlementFinalized with unresolved balance and no write-off => short_paid (even before due)", () => {
    const inv = postInvoiceFromPackage(samplePackage(), {
      dueDate: "2026-03-01",
      settlementFinalized: true,
    })
    const asOf = "2026-01-20"
    const st = computeInvoiceArStatus(
      inv,
      [alloc(inv, 25, inv.lines[0].invoiceLineId)],
      [],
      asOf,
    )
    expect(st.invoiceOpenBalance).toBe(75)
    expect(st.shortPaid).toBe(true)
    expect(st.partiallyPaid).toBe(false)
    expect(st.overdue).toBe(false)
  })

  it("invoice closed with write-off contribution => written_off, not paid", () => {
    const inv = postInvoiceFromPackage(samplePackage(), { dueDate: "2026-01-15" })
    const asOf = "2026-01-20"
    const st = computeInvoiceArStatus(
      inv,
      [alloc(inv, 80)],
      [
        {
          adjustmentId: "w1",
          type: "write_off",
          invoiceId: inv.invoiceId,
          amount: 20,
          createdAt: "2026-01-18T00:00:00Z",
        },
      ],
      asOf,
    )
    expect(st.invoiceOpenBalance).toBe(0)
    expect(st.writtenOff).toBe(true)
    expect(st.paid).toBe(false)
    expect(st.partiallyPaid).toBe(false)
    expect(st.shortPaid).toBe(false)
  })

  it("full write-off only => written_off, not paid", () => {
    const inv = postInvoiceFromPackage(samplePackage(), { dueDate: "2026-01-15" })
    const st = computeInvoiceArStatus(
      inv,
      [],
      [
        {
          adjustmentId: "w1",
          type: "write_off",
          invoiceId: inv.invoiceId,
          amount: 100,
          createdAt: "2026-01-18T00:00:00Z",
        },
      ],
      "2026-01-20",
    )
    expect(st.invoiceOpenBalance).toBe(0)
    expect(st.writtenOff).toBe(true)
    expect(st.paid).toBe(false)
  })

  it("fully cash-paid with no write-off => paid", () => {
    const inv = postInvoiceFromPackage(samplePackage(), { dueDate: "2026-01-15" })
    const st = computeInvoiceArStatus(inv, [alloc(inv, 100)], [], "2026-01-20")
    expect(st.invoiceOpenBalance).toBe(0)
    expect(st.paid).toBe(true)
    expect(st.writtenOff).toBe(false)
    expect(st.partiallyPaid).toBe(false)
    expect(st.shortPaid).toBe(false)
  })
})

describe("header allocation FIFO", () => {
  it("distributes header-only allocation across lines by eventDate order", () => {
    const inv = postInvoiceFromPackage(samplePackage())
    const allocations = [
      {
        allocationId: "h1",
        paymentId: "p1",
        invoiceId: inv.invoiceId,
        amount: 70,
      },
    ]
    const lines = computePostedInvoiceLineBalances(inv, allocations, [])
    const byId = Object.fromEntries(lines.map((l) => [l.invoiceLineId, l]))
    const l0 = inv.lines[0].invoiceLineId
    const l1 = inv.lines[1].invoiceLineId
    expect(byId[l0].appliedPayments).toBe(60)
    expect(byId[l1].appliedPayments).toBe(10)
  })
})

describe("reports", () => {
  it("buildUnappliedCashView matches payment minus allocations", () => {
    const inv = postInvoiceFromPackage(samplePackage())
    const ledger = {
      invoices: [inv],
      payments: [
        {
          paymentId: "p1",
          sponsorId: "sponsor-x",
          amount: 100,
          paymentDate: "2026-02-05",
        },
      ],
      allocations: [
        {
          allocationId: "a1",
          paymentId: "p1",
          invoiceId: inv.invoiceId,
          amount: 40,
        },
      ],
      adjustments: [],
    }
    const rows = buildUnappliedCashView(ledger)
    expect(rows[0].paymentUnappliedBalance).toBe(60)
    expect(paymentUnappliedBalance(ledger.payments[0], ledger.allocations)).toBe(60)
  })

  it("buildSponsorArRollup sums open balances", () => {
    const inv = postInvoiceFromPackage(samplePackage())
    const ledger = {
      invoices: [inv],
      payments: [],
      allocations: [],
      adjustments: [],
    }
    const rollup = buildSponsorArRollup(ledger, "2026-03-01")
    expect(rollup).toEqual([
      {
        sponsorId: "sponsor-x",
        outstandingAr: 100,
        invoiceCount: 1,
        openInvoiceIds: [inv.invoiceId],
      },
    ])
  })

  it("buildArAgingByDueDate assigns buckets", () => {
    const inv = postInvoiceFromPackage(samplePackage(), { dueDate: "2026-01-01" })
    const ledger = { invoices: [inv], payments: [], allocations: [], adjustments: [] }
    const aging = buildArAgingByDueDate(ledger, "2026-02-15")
    expect(aging).toHaveLength(1)
    expect(aging[0].bucket).toBe("31_60")
    expect(aging[0].daysPastDue).toBeGreaterThan(30)
  })

  it("buildInvoiceBalanceView returns one row per invoice", () => {
    const inv = postInvoiceFromPackage(samplePackage())
    const ledger = {
      invoices: [inv],
      payments: [],
      allocations: [],
      adjustments: [],
    }
    const view = buildInvoiceBalanceView(ledger, "2026-01-10")
    expect(view).toHaveLength(1)
    expect(view[0].sponsorId).toBe("sponsor-x")
    expect(view[0].invoiceOpenBalance).toBe(100)
  })
})
