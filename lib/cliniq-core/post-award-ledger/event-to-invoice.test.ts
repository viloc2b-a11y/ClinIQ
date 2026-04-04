import { describe, expect, it } from "vitest"

import { buildClaimItemsFromLedger, buildInvoicePackage } from "../claims/build-claims"
import { buildLedgerRowsFromBillables } from "./billable-to-ledger"
import { generateBillablesFromEvent } from "./billables-from-events"
import { generateExpectedBillablesFromBudget } from "./expected-billables"
import { quantifyRevenueLeakage } from "./quantify-leakage"
import type { InternalBudgetLine } from "../budget-gap/types"

const sampleBudget: InternalBudgetLine[] = [
  {
    id: "b-su",
    lineCode: "SU",
    label: "Startup fee",
    category: "Startup",
    visitName: "N/A",
    unit: "ls",
    quantity: 1,
    internalUnitCost: 8000,
    internalTotal: 8000,
    notes: "",
    source: "internal-model",
  },
]

const sampleEvents = [
  {
    id: "evt-su-1",
    studyId: "S-1",
    occurredAt: "2026-01-10T10:00:00.000Z",
    eventType: "startup",
    lineCode: "SU",
    quantity: 1,
  },
] as const

const OPTIONS = {
  sponsorId: "SP-1",
  subjectId: "SUB-1",
  visitName: "Startup",
  invoicePeriodStart: "2026-01-01",
  invoicePeriodEnd: "2026-01-31",
}

describe("ClinIQ end-to-end: event -> invoice", () => {
  it("produces a valid invoice package from raw events", () => {
    const expected = generateExpectedBillablesFromBudget(sampleBudget, {
      studyId: "S-1",
    })
    expect(expected.length).toBeGreaterThan(0)

    const instances = sampleEvents.flatMap((evt) => {
      const b = generateBillablesFromEvent(evt, expected)
      return b ? [b] : []
    })
    expect(instances.length).toBeGreaterThan(0)

    const ledgerRows = buildLedgerRowsFromBillables(instances, OPTIONS)
    expect(ledgerRows.length).toBeGreaterThan(0)
    expect((ledgerRows[0] as { status?: string }).status).toBe("ready")
    expect(ledgerRows[0].approved).toBe(true)

    const claimItems = buildClaimItemsFromLedger(ledgerRows)
    expect(claimItems.length).toBeGreaterThan(0)

    const packages = buildInvoicePackage({
      claimItems,
      generatedAt: "2026-02-01T00:00:00.000Z",
    })

    expect(packages.length).toBe(1)
    const invoice = packages[0]!
    expect(invoice.subtotal).toBeGreaterThan(0)
    expect(invoice.lineCount).toBe(ledgerRows.length)
    expect(invoice.hasBlockingIssues).toBe(false)

    const leakage = quantifyRevenueLeakage(expected, invoice)
    expect(leakage.totalExpected).toBeGreaterThan(0)
    expect(leakage.totalInvoiced).toBeGreaterThanOrEqual(0)
    expect(leakage.totalLeakage).toBeGreaterThanOrEqual(0)
    expect(["ok", "warning", "critical"] as const).toContain(leakage.status)
    expect(leakage.topLeakers.length).toBeLessThanOrEqual(3)
  })
})
