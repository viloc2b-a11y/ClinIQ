import { describe, expect, it } from "vitest"

import { buildClaimItemsFromRecords } from "../claims/build-claim-items-from-records"
import { isInvoiceReadyClaimItem } from "../claims/build-claims"
import { buildInvoicePackagesFromClaims } from "../invoicing/build-invoice-packages"
import type { BillableInstance } from "../post-award-ledger/types"
import { buildExecutionToCashSummary } from "./build-execution-to-cash-summary"
import { computeRevenueLeakage } from "./compute-revenue-leakage"

function billable(i: number, totalAmount: number, lineCode: string): BillableInstance {
  const d = String((i % 28) + 1).padStart(2, "0")
  return {
    id: `bill-${i}`,
    eventLogId: `evt-${i}`,
    studyId: "STUDY-1",
    lineCode,
    label: `Activity ${i}`,
    category: "visits",
    quantity: 1,
    unitAmount: totalAmount,
    totalAmount,
    occurredAt: `2026-04-${d}T12:00:00.000Z`,
  }
}

describe("STEP 81 — Claims & Revenue Layer (Execution → Cash)", () => {
  it("basic path: claims from records, invoices ready-only lines, leakage in $", () => {
    const records = [
      billable(1, 1000, "V1"),
      billable(2, 500, "V2"),
    ]

    const claims = buildClaimItemsFromRecords({ records })
    expect(claims.data).toHaveLength(2)
    expect(claims.summary.total).toBe(2)
    expect(claims.summary.totalAmount).toBe(1500)
    expect(claims.data[0]!.billableInstanceId).toBe("bill-1")
    expect(claims.data[0]!.eventLogId).toBe("evt-1")

    const invoices = buildInvoicePackagesFromClaims({ claimItems: claims.data })
    expect(invoices.data.length).toBeGreaterThanOrEqual(1)
    for (const pkg of invoices.data) {
      for (const line of pkg.lines) {
        expect(line.status).toBe("ready")
        const c = claims.data.find((x) => x.id === line.claimItemId)
        expect(c).toBeDefined()
        expect(isInvoiceReadyClaimItem(c!)).toBe(true)
      }
    }

    const leakage = computeRevenueLeakage({
      actionItems: [
        { id: "ac-1", recordId: "bill-2", eventLogId: "evt-2", leakageValue: 250 },
      ],
    })
    expect(leakage.summary.totalItems).toBe(1)
    expect(leakage.summary.totalValue).toBe(250)

    const consolidated = buildExecutionToCashSummary({ claims, invoices, leakage })
    expect(consolidated).toEqual({
      claims: { summary: { total: 2, totalAmount: 1500 } },
      invoices: {
        summary: {
          totalPackages: invoices.summary.totalPackages,
          totalAmount: invoices.summary.totalAmount,
        },
      },
      leakage: { summary: { totalItems: 1, totalValue: 250 } },
    })
  })

  it("end-to-end mock: 24 claims, 3 invoice packages, 5 leakage items (deterministic totals)", () => {
    const amounts19 = [
      ...Array.from({ length: 7 }, () => 400),
      ...Array.from({ length: 7 }, () => 500),
      ...Array.from({ length: 5 }, () => 700),
    ]
    expect(amounts19.length).toBe(19)
    const sum19 = amounts19.reduce((a, b) => a + b, 0)
    expect(sum19).toBe(9800)

    const amounts5 = [530, 520, 540, 510, 550]
    expect(amounts5.reduce((a, b) => a + b, 0)).toBe(2650)

    const records: BillableInstance[] = []
    let idx = 0
    for (const a of amounts19) {
      records.push(billable(idx, a, `L${idx}`))
      idx += 1
    }
    for (const a of amounts5) {
      records.push(billable(idx, a, `L${idx}`))
      idx += 1
    }
    expect(records.length).toBe(24)

    const overrides = records.map((_, i) => {
      if (i < 7) {
        return {
          sponsorId: "SP-A",
          invoicePeriodStart: "2026-01-01",
          invoicePeriodEnd: "2026-01-31",
        }
      }
      if (i < 14) {
        return {
          sponsorId: "SP-A",
          invoicePeriodStart: "2026-02-01",
          invoicePeriodEnd: "2026-02-28",
        }
      }
      if (i < 19) {
        return {
          sponsorId: "SP-B",
          invoicePeriodStart: "2026-01-01",
          invoicePeriodEnd: "2026-01-31",
        }
      }
      return {
        sponsorId: "SP-A",
        invoicePeriodStart: "2026-01-01",
        invoicePeriodEnd: "2026-01-31",
        approved: false,
        supportDocumentationComplete: false,
      }
    })

    const claims = buildClaimItemsFromRecords({ records, ledgerRowOverrides: overrides })
    expect(claims.summary.total).toBe(24)
    expect(claims.summary.totalAmount).toBe(12450)

    const invoices = buildInvoicePackagesFromClaims({ claimItems: claims.data })
    expect(invoices.summary.totalPackages).toBe(3)
    expect(invoices.summary.totalAmount).toBe(9800)
    for (const pkg of invoices.data) {
      for (const line of pkg.lines) {
        expect(line.status).toBe("ready")
      }
    }

    const leakage = computeRevenueLeakage({
      actionItems: amounts5.map((v, j) => ({
        id: `leak-${j}`,
        recordId: `bill-${19 + j}`,
        eventLogId: `evt-${19 + j}`,
        leakageValue: v,
      })),
    })
    expect(leakage.summary.totalItems).toBe(5)
    expect(leakage.summary.totalValue).toBe(2650)

    expect(
      buildExecutionToCashSummary({ claims, invoices, leakage }),
    ).toEqual({
      claims: { summary: { total: 24, totalAmount: 12450 } },
      invoices: { summary: { totalPackages: 3, totalAmount: 9800 } },
      leakage: { summary: { totalItems: 5, totalValue: 2650 } },
    })
  })
})
