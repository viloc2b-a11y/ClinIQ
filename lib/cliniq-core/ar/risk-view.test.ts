import { describe, expect, it } from "vitest"

import type {
  InvoiceArStatus,
  InvoiceBalanceRow,
  PostedInvoice,
} from "./types"
import { buildInvoiceRiskView, buildSponsorRiskRollup } from "./risk-view"

function posted(inv: Partial<PostedInvoice> & { invoiceId: string }): PostedInvoice {
  return {
    schemaVersion: "1.0",
    studyId: inv.studyId ?? "study-1",
    sponsorId: inv.sponsorId ?? "sp-1",
    invoicePeriodStart: inv.invoicePeriodStart ?? "2026-01-01",
    invoicePeriodEnd: inv.invoicePeriodEnd ?? "2026-01-31",
    postedAt: inv.postedAt ?? "2026-02-01T00:00:00Z",
    dueDate: inv.dueDate ?? "2026-02-15",
    lines: inv.lines ?? [],
    invoiceTotal: inv.invoiceTotal ?? 100,
    lineCount: inv.lineCount ?? 0,
    ...inv,
  }
}

function balanceRow(
  b: Partial<InvoiceBalanceRow> & { invoiceId: string },
): InvoiceBalanceRow {
  const total = b.invoiceTotal ?? 100
  const applied = b.appliedPayments ?? 0
  const wo = b.writeOffs ?? 0
  const open = b.invoiceOpenBalance ?? total - applied - wo
  return {
    invoiceId: b.invoiceId,
    invoiceTotal: total,
    appliedPayments: applied,
    writeOffs: wo,
    invoiceOpenBalance: open,
    paid: b.paid ?? (open === 0 && wo === 0),
    partiallyPaid: b.partiallyPaid ?? false,
    shortPaid: b.shortPaid ?? false,
    writtenOff: b.writtenOff ?? false,
    overdue: b.overdue ?? false,
    sponsorId: b.sponsorId ?? "sp-1",
    studyId: b.studyId ?? "study-1",
    dueDate: b.dueDate ?? "2026-02-15",
    postedAt: b.postedAt ?? "2026-02-01T00:00:00Z",
    invoicePeriodStart: b.invoicePeriodStart ?? "2026-01-01",
    invoicePeriodEnd: b.invoicePeriodEnd ?? "2026-01-31",
  }
}

describe("buildInvoiceRiskView", () => {
  it("overdue 45 days + aging bucket 31+ => HIGH", () => {
    const invoiceId = "inv-high-age"
    const rows = buildInvoiceRiskView({
      invoices: [posted({ invoiceId })],
      balances: [
        balanceRow({
          invoiceId,
          overdue: true,
          invoiceOpenBalance: 100,
          partiallyPaid: false,
          shortPaid: false,
        }),
      ],
      aging: [
        {
          invoiceId,
          sponsorId: "sp-1",
          studyId: "study-1",
          dueDate: "2026-01-01",
          invoiceOpenBalance: 100,
          bucket: "31_60",
          daysPastDue: 45,
        },
      ],
      asOfDate: "2026-02-15",
    })
    expect(rows).toHaveLength(1)
    expect(rows[0].riskLevel).toBe("high")
    expect(rows[0].riskReasons).toContain("overdue")
    expect(rows[0].riskReasons).toContain("aging_bucket_31_plus")
  })

  it("short_paid + overdue => HIGH (even in 1_30 bucket)", () => {
    const invoiceId = "inv-short-od"
    const rows = buildInvoiceRiskView({
      invoices: [posted({ invoiceId })],
      balances: [
        balanceRow({
          invoiceId,
          overdue: true,
          shortPaid: true,
          invoiceOpenBalance: 50,
          appliedPayments: 50,
          partiallyPaid: true,
        }),
      ],
      aging: [
        {
          invoiceId,
          sponsorId: "sp-1",
          studyId: "study-1",
          dueDate: "2026-01-10",
          invoiceOpenBalance: 50,
          bucket: "1_30",
          daysPastDue: 12,
        },
      ],
      asOfDate: "2026-01-22",
    })
    expect(rows[0].riskLevel).toBe("high")
    expect(rows[0].riskReasons).toContain("short_paid")
    expect(rows[0].riskReasons).toContain("overdue")
  })

  it("partially paid + stale payment activity => MEDIUM", () => {
    const invoiceId = "inv-stale-partial"
    const rows = buildInvoiceRiskView({
      invoices: [posted({ invoiceId, dueDate: "2026-03-01" })],
      balances: [
        balanceRow({
          invoiceId,
          dueDate: "2026-03-01",
          overdue: false,
          partiallyPaid: true,
          shortPaid: false,
          appliedPayments: 20,
          invoiceOpenBalance: 80,
        }),
      ],
      aging: [],
      asOfDate: "2026-02-10",
      stalePaymentDaysThreshold: 14,
      allocations: [
        {
          allocationId: "a1",
          paymentId: "p1",
          invoiceId,
          amount: 20,
        },
      ],
      payments: [
        {
          paymentId: "p1",
          sponsorId: "sp-1",
          amount: 20,
          paymentDate: "2026-01-15",
        },
      ],
    })
    expect(rows[0].riskLevel).toBe("medium")
    expect(rows[0].daysSinceLastPayment).toBe(26)
    expect(rows[0].riskReasons).toContain("partially_paid_stale")
  })

  it("current + partial + recent payment => LOW", () => {
    const invoiceId = "inv-recent-partial"
    const rows = buildInvoiceRiskView({
      invoices: [posted({ invoiceId, dueDate: "2026-03-01" })],
      balances: [
        balanceRow({
          invoiceId,
          dueDate: "2026-03-01",
          overdue: false,
          partiallyPaid: true,
          appliedPayments: 30,
          invoiceOpenBalance: 70,
        }),
      ],
      aging: [],
      asOfDate: "2026-02-10",
      stalePaymentDaysThreshold: 14,
      allocations: [
        {
          allocationId: "a1",
          paymentId: "p1",
          invoiceId,
          amount: 30,
        },
      ],
      payments: [
        {
          paymentId: "p1",
          sponsorId: "sp-1",
          amount: 30,
          paymentDate: "2026-02-08",
        },
      ],
    })
    expect(rows[0].riskLevel).toBe("low")
    expect(rows[0].daysSinceLastPayment).toBe(2)
    expect(rows[0].riskReasons).not.toContain("partially_paid_stale")
  })

  it("fully paid (zero open) => LOW with empty reasons", () => {
    const invoiceId = "inv-paid"
    const rows = buildInvoiceRiskView({
      invoices: [posted({ invoiceId })],
      balances: [
        balanceRow({
          invoiceId,
          paid: true,
          appliedPayments: 100,
          invoiceOpenBalance: 0,
          writeOffs: 0,
          partiallyPaid: false,
          shortPaid: false,
          overdue: false,
        }),
      ],
      aging: [],
      asOfDate: "2026-03-01",
    })
    expect(rows[0].riskLevel).toBe("low")
    expect(rows[0].openBalance).toBe(0)
    expect(rows[0].riskReasons).toEqual([])
  })

  it("sorts HIGH before MEDIUM before LOW, then open balance desc", () => {
    const params = {
      invoices: [
        posted({ invoiceId: "inv-low" }),
        posted({ invoiceId: "inv-high" }),
        posted({ invoiceId: "inv-med" }),
      ],
      balances: [
        balanceRow({
          invoiceId: "inv-low",
          overdue: false,
          partiallyPaid: true,
          appliedPayments: 10,
          invoiceOpenBalance: 90,
        }),
        balanceRow({
          invoiceId: "inv-high",
          overdue: true,
          shortPaid: true,
          appliedPayments: 10,
          invoiceOpenBalance: 40,
        }),
        balanceRow({
          invoiceId: "inv-med",
          overdue: true,
          partiallyPaid: false,
          invoiceOpenBalance: 200,
        }),
      ],
      aging: [
        {
          invoiceId: "inv-high",
          sponsorId: "sp-1",
          studyId: "study-1",
          dueDate: "2026-01-01",
          invoiceOpenBalance: 40,
          bucket: "1_30",
          daysPastDue: 10,
        },
        {
          invoiceId: "inv-med",
          sponsorId: "sp-1",
          studyId: "study-1",
          dueDate: "2026-01-01",
          invoiceOpenBalance: 200,
          bucket: "1_30",
          daysPastDue: 10,
        },
      ],
      asOfDate: "2026-01-11",
    }
    const rows = buildInvoiceRiskView(params)
    expect(rows.map((r) => r.invoiceId)).toEqual([
      "inv-high",
      "inv-med",
      "inv-low",
    ])
  })
})

describe("buildSponsorRiskRollup", () => {
  it("sums open balance by tier and counts invoices", () => {
    const st = (id: string, open: number): InvoiceArStatus => ({
      invoiceId: id,
      invoiceTotal: 100,
      appliedPayments: 0,
      writeOffs: 0,
      invoiceOpenBalance: open,
      paid: open === 0,
      partiallyPaid: false,
      shortPaid: false,
      writtenOff: false,
      overdue: false,
    })
    const rows = [
      {
        invoiceId: "a",
        sponsorId: "s",
        studyId: "st",
        invoiceDate: "2026-01-01",
        dueDate: "2026-02-01",
        invoiceTotal: 100,
        appliedPayments: 0,
        writeOffs: 0,
        openBalance: 100,
        status: st("a", 100),
        agingBucket: "31_60" as const,
        daysPastDue: 40,
        riskLevel: "high" as const,
        riskReasons: [],
      },
      {
        invoiceId: "b",
        sponsorId: "s",
        studyId: "st",
        invoiceDate: "2026-01-01",
        dueDate: "2026-02-01",
        invoiceTotal: 50,
        appliedPayments: 0,
        writeOffs: 0,
        openBalance: 50,
        status: st("b", 50),
        agingBucket: "1_30" as const,
        daysPastDue: 10,
        riskLevel: "medium" as const,
        riskReasons: [],
      },
      {
        invoiceId: "c",
        sponsorId: "s",
        studyId: "st",
        invoiceDate: "2026-01-01",
        dueDate: "2026-02-01",
        invoiceTotal: 100,
        appliedPayments: 100,
        writeOffs: 0,
        openBalance: 0,
        status: st("c", 0),
        agingBucket: "current" as const,
        daysPastDue: 0,
        riskLevel: "low" as const,
        riskReasons: [],
      },
    ]
    const rollup = buildSponsorRiskRollup(rows)
    expect(rollup.totalOpenBalance).toBe(150)
    expect(rollup.highRiskAmount).toBe(100)
    expect(rollup.mediumRiskAmount).toBe(50)
    expect(rollup.invoiceCountByRiskLevel).toEqual({
      high: 1,
      medium: 1,
      low: 1,
    })
  })
})
