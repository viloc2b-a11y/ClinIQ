import { describe, expect, it } from "vitest"

import type { CollectionsActionRow, InvoiceRiskRow } from "./types"
import { buildArCommandSummary } from "./command-summary"

function queueRow(
  p: Partial<CollectionsActionRow> &
    Pick<CollectionsActionRow, "invoiceId" | "priorityRank" | "recommendedAction">,
): CollectionsActionRow {
  return {
    sponsorId: p.sponsorId ?? "s",
    studyId: p.studyId ?? "st",
    riskLevel: p.riskLevel ?? "low",
    riskReasons: p.riskReasons ?? [],
    openBalance: p.openBalance ?? 0,
    daysPastDue: p.daysPastDue ?? 0,
    ...p,
  }
}

function riskRow(
  p: Partial<InvoiceRiskRow> &
    Pick<InvoiceRiskRow, "invoiceId" | "riskLevel" | "openBalance">,
): InvoiceRiskRow {
  return {
    sponsorId: p.sponsorId ?? "s",
    studyId: p.studyId ?? "st",
    invoiceDate: p.invoiceDate ?? "2026-01-01",
    dueDate: p.dueDate ?? "2026-02-01",
    invoiceTotal: p.invoiceTotal ?? 100,
    appliedPayments: p.appliedPayments ?? 0,
    writeOffs: p.writeOffs ?? 0,
    status: p.status!,
    agingBucket: p.agingBucket ?? "current",
    daysPastDue: p.daysPastDue ?? 0,
    riskReasons: p.riskReasons ?? [],
    ...p,
  } as InvoiceRiskRow
}

const minimalStatus = {
  invoiceId: "x",
  invoiceTotal: 100,
  appliedPayments: 0,
  writeOffs: 0,
  invoiceOpenBalance: 100,
  paid: false,
  partiallyPaid: false,
  shortPaid: false,
  writtenOff: false,
  overdue: false,
}

describe("buildArCommandSummary", () => {
  it("totals outstanding and by risk level", () => {
    const summary = buildArCommandSummary({
      asOfDate: "2026-03-01",
      riskRows: [
        riskRow({
          invoiceId: "h1",
          riskLevel: "high",
          openBalance: 100,
          status: { ...minimalStatus, invoiceId: "h1", invoiceOpenBalance: 100 },
        }),
        riskRow({
          invoiceId: "m1",
          riskLevel: "medium",
          openBalance: 40,
          status: { ...minimalStatus, invoiceId: "m1", invoiceOpenBalance: 40 },
        }),
        riskRow({
          invoiceId: "l1",
          riskLevel: "low",
          openBalance: 10,
          status: { ...minimalStatus, invoiceId: "l1", invoiceOpenBalance: 10 },
        }),
      ],
      queueRows: [],
    })
    expect(summary.totalOutstandingAr).toBe(150)
    expect(summary.totalHighRiskAr).toBe(100)
    expect(summary.totalMediumRiskAr).toBe(40)
    expect(summary.totalLowRiskAr).toBe(10)
  })

  it("counts overdue and short_paid from riskReasons", () => {
    const summary = buildArCommandSummary({
      asOfDate: "2026-03-01",
      riskRows: [
        riskRow({
          invoiceId: "a",
          riskLevel: "high",
          openBalance: 50,
          riskReasons: ["overdue", "short_paid"],
          status: { ...minimalStatus, invoiceId: "a", invoiceOpenBalance: 50 },
        }),
        riskRow({
          invoiceId: "b",
          riskLevel: "medium",
          openBalance: 30,
          riskReasons: ["overdue"],
          status: { ...minimalStatus, invoiceId: "b", invoiceOpenBalance: 30 },
        }),
        riskRow({
          invoiceId: "c",
          riskLevel: "low",
          openBalance: 0,
          riskReasons: [],
          status: { ...minimalStatus, invoiceId: "c", invoiceOpenBalance: 0, paid: true },
        }),
      ],
      queueRows: [],
    })
    expect(summary.overdueInvoiceCount).toBe(2)
    expect(summary.shortPaidInvoiceCount).toBe(1)
  })

  it("invoicesRequiringActionNow excludes monitor only", () => {
    const summary = buildArCommandSummary({
      asOfDate: "2026-03-01",
      riskRows: [],
      queueRows: [
        queueRow({
          invoiceId: "a",
          priorityRank: 1,
          recommendedAction: "contact_now",
        }),
        queueRow({
          invoiceId: "b",
          priorityRank: 2,
          recommendedAction: "monitor",
        }),
        queueRow({
          invoiceId: "c",
          priorityRank: 3,
          recommendedAction: "follow_up_this_week",
        }),
      ],
    })
    expect(summary.invoicesRequiringActionNow).toBe(2)
  })

  it("topPriorityInvoices defaults to first 5 by priorityRank", () => {
    const queueRows = [1, 2, 3, 4, 5, 6, 7].map((n) =>
      queueRow({
        invoiceId: `inv-${n}`,
        priorityRank: n,
        recommendedAction: "monitor",
      }),
    )
    const summary = buildArCommandSummary({
      asOfDate: "2026-03-01",
      riskRows: [],
      queueRows,
    })
    expect(summary.topPriorityInvoices).toHaveLength(5)
    expect(summary.topPriorityInvoices.map((r) => r.invoiceId)).toEqual([
      "inv-1",
      "inv-2",
      "inv-3",
      "inv-4",
      "inv-5",
    ])
  })

  it("topPriorityInvoices respects custom topN and sorts by priorityRank", () => {
    const summary = buildArCommandSummary({
      asOfDate: "2026-03-01",
      riskRows: [],
      queueRows: [
        queueRow({
          invoiceId: "z",
          priorityRank: 3,
          recommendedAction: "monitor",
        }),
        queueRow({
          invoiceId: "a",
          priorityRank: 1,
          recommendedAction: "monitor",
        }),
        queueRow({
          invoiceId: "m",
          priorityRank: 2,
          recommendedAction: "monitor",
        }),
      ],
      topN: 2,
    })
    expect(summary.topPriorityInvoices.map((r) => r.invoiceId)).toEqual(["a", "m"])
  })

  it("empty inputs yield zeros and empty top list", () => {
    const summary = buildArCommandSummary({
      asOfDate: "2026-03-01",
      riskRows: [],
      queueRows: [],
    })
    expect(summary.asOfDate).toBe("2026-03-01")
    expect(summary.totalOutstandingAr).toBe(0)
    expect(summary.totalHighRiskAr).toBe(0)
    expect(summary.totalMediumRiskAr).toBe(0)
    expect(summary.totalLowRiskAr).toBe(0)
    expect(summary.overdueInvoiceCount).toBe(0)
    expect(summary.shortPaidInvoiceCount).toBe(0)
    expect(summary.invoicesRequiringActionNow).toBe(0)
    expect(summary.topPriorityInvoices).toEqual([])
  })
})
