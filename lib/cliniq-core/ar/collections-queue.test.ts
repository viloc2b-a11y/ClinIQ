import { describe, expect, it } from "vitest"

import type { InvoiceArStatus, InvoiceRiskRow } from "./types"
import { buildCollectionsActionQueue } from "./collections-queue"

function status(id: string, open: number): InvoiceArStatus {
  return {
    invoiceId: id,
    invoiceTotal: 100,
    appliedPayments: 100 - open,
    writeOffs: 0,
    invoiceOpenBalance: open,
    paid: open === 0,
    partiallyPaid: open > 0 && open < 100,
    shortPaid: false,
    writtenOff: false,
    overdue: false,
  }
}

function riskRow(
  p: Partial<InvoiceRiskRow> & Pick<InvoiceRiskRow, "invoiceId" | "riskLevel">,
): InvoiceRiskRow {
  const open = p.openBalance ?? 100
  return {
    sponsorId: p.sponsorId ?? "s",
    studyId: p.studyId ?? "st",
    invoiceDate: p.invoiceDate ?? "2026-01-01",
    dueDate: p.dueDate ?? "2026-02-01",
    invoiceTotal: p.invoiceTotal ?? 100,
    appliedPayments: p.appliedPayments ?? 0,
    writeOffs: p.writeOffs ?? 0,
    openBalance: open,
    status: p.status ?? status(p.invoiceId, open),
    agingBucket: p.agingBucket ?? "current",
    daysPastDue: p.daysPastDue ?? 0,
    daysSinceLastPayment: p.daysSinceLastPayment,
    riskReasons: p.riskReasons ?? [],
    ...p,
  }
}

describe("buildCollectionsActionQueue", () => {
  it("HIGH + short_paid => review_short_pay (before overdue when both)", () => {
    const q = buildCollectionsActionQueue({
      riskRows: [
        riskRow({
          invoiceId: "a",
          riskLevel: "high",
          riskReasons: ["short_paid", "overdue"],
          openBalance: 50,
        }),
      ],
    })
    expect(q).toHaveLength(1)
    expect(q[0].recommendedAction).toBe("review_short_pay")
    expect(q[0].priorityRank).toBe(1)
  })

  it("HIGH + overdue without short_paid => contact_now", () => {
    const q = buildCollectionsActionQueue({
      riskRows: [
        riskRow({
          invoiceId: "b",
          riskLevel: "high",
          riskReasons: ["overdue", "aging_bucket_31_plus"],
          openBalance: 80,
        }),
      ],
    })
    expect(q[0].recommendedAction).toBe("contact_now")
  })

  it("HIGH without short_paid or overdue in reasons => contact_now fallback", () => {
    const q = buildCollectionsActionQueue({
      riskRows: [
        riskRow({
          invoiceId: "c",
          riskLevel: "high",
          riskReasons: [],
          openBalance: 10,
        }),
      ],
    })
    expect(q[0].recommendedAction).toBe("contact_now")
  })

  it("MEDIUM => follow_up_this_week", () => {
    const q = buildCollectionsActionQueue({
      riskRows: [
        riskRow({
          invoiceId: "d",
          riskLevel: "medium",
          riskReasons: ["partially_paid_stale"],
          openBalance: 40,
        }),
      ],
    })
    expect(q[0].recommendedAction).toBe("follow_up_this_week")
  })

  it("LOW => monitor", () => {
    const q = buildCollectionsActionQueue({
      riskRows: [
        riskRow({
          invoiceId: "e",
          riskLevel: "low",
          riskReasons: [],
          openBalance: 0,
        }),
      ],
    })
    expect(q[0].recommendedAction).toBe("monitor")
  })

  it("priorityRank: HIGH before MEDIUM before LOW; then openBalance desc; daysPastDue desc; invoiceId asc", () => {
    const q = buildCollectionsActionQueue({
      riskRows: [
        riskRow({
          invoiceId: "z-low",
          riskLevel: "low",
          openBalance: 999,
          daysPastDue: 99,
        }),
        riskRow({
          invoiceId: "m1",
          riskLevel: "medium",
          openBalance: 100,
          daysPastDue: 5,
        }),
        riskRow({
          invoiceId: "h1",
          riskLevel: "high",
          riskReasons: ["overdue"],
          openBalance: 50,
          daysPastDue: 10,
        }),
        riskRow({
          invoiceId: "h2",
          riskLevel: "high",
          riskReasons: ["overdue"],
          openBalance: 100,
          daysPastDue: 5,
        }),
        riskRow({
          invoiceId: "h3",
          riskLevel: "high",
          riskReasons: ["overdue"],
          openBalance: 100,
          daysPastDue: 20,
        }),
        riskRow({
          invoiceId: "aa-high",
          riskLevel: "high",
          riskReasons: ["overdue"],
          openBalance: 100,
          daysPastDue: 20,
        }),
      ],
    })
    expect(q.map((r) => r.invoiceId)).toEqual([
      "aa-high",
      "h3",
      "h2",
      "h1",
      "m1",
      "z-low",
    ])
    expect(q.map((r) => r.priorityRank)).toEqual([1, 2, 3, 4, 5, 6])
  })

  it("copies riskReasons array", () => {
    const reasons = ["overdue"]
    const row = riskRow({
      invoiceId: "x",
      riskLevel: "high",
      riskReasons: reasons,
    })
    const q = buildCollectionsActionQueue({ riskRows: [row] })
    q[0].riskReasons.push("mutated")
    expect(reasons).toEqual(["overdue"])
  })
})
