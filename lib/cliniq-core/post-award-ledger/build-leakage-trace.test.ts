import { describe, expect, it } from "vitest"

import type { ClaimItem, ClaimsLedgerRow, InvoicePackage } from "../claims/types"
import { buildLeakageTrace } from "./build-leakage-trace"
import type { ExpectedBillable } from "./types"

const STUDY = "S-1"

function eb(
  overrides: Partial<ExpectedBillable> &
    Pick<ExpectedBillable, "lineCode" | "visitName">,
): ExpectedBillable {
  return {
    id: "eb-1",
    budgetLineId: "bl-1",
    studyId: STUDY,
    label: overrides.label ?? overrides.lineCode,
    category: "Visit",
    unit: "ea",
    expectedQuantity: 1,
    unitPrice: 100,
    expectedRevenue: 100,
    ...overrides,
  }
}

function ledger(overrides: Partial<ClaimsLedgerRow> = {}): ClaimsLedgerRow {
  return {
    studyId: STUDY,
    eventDate: "2026-01-10T12:00:00.000Z",
    lineCode: "V1",
    label: "Visit",
    amount: 100,
    approved: true,
    subjectId: "SUB-1",
    visitName: "Visit 1",
    billableInstanceId: "bill-1",
    eventLogId: "evt-1",
    supportDocumentationComplete: true,
    ...overrides,
  }
}

function claim(overrides: Partial<ClaimItem> = {}): ClaimItem {
  return {
    id: "claim-1",
    studyId: STUDY,
    eventDate: "2026-01-10T12:00:00.000Z",
    lineCode: "V1",
    label: "Visit",
    amount: 100,
    status: "ready",
    requiresReview: false,
    approved: true,
    supportDocumentationComplete: true,
    billableInstanceId: "bill-1",
    eventLogId: "evt-1",
    subjectId: "SUB-1",
    visitName: "Visit 1",
    ...overrides,
  }
}

function inv(lines: InvoicePackage["lines"]): InvoicePackage {
  const subtotal = lines.reduce((s, l) => s + l.amount, 0)
  return {
    schemaVersion: "1.0",
    studyId: STUDY,
    sponsorId: "SP",
    invoicePeriodStart: "2026-01-01",
    invoicePeriodEnd: "2026-01-31",
    generatedAt: "2026-02-01T00:00:00.000Z",
    lines,
    subtotal,
    lineCount: lines.length,
    hasBlockingIssues: false,
  }
}

function invoiceLine(
  claimItemId: string,
  amount: number,
  overrides: Partial<InvoicePackage["lines"][number]> = {},
): InvoicePackage["lines"][number] {
  return {
    id: `ln-${claimItemId}`,
    studyId: STUDY,
    sponsorId: "SP",
    subjectId: "SUB-1",
    visitName: "Visit 1",
    eventDate: "2026-01-10T12:00:00.000Z",
    lineCode: "V1",
    label: "Visit",
    amount,
    status: "ready",
    claimItemId,
    ...overrides,
  }
}

describe("buildLeakageTrace", () => {
  it("STEP 6 — operational JSON sample (ledger only, ECG / Visit 3 / not_invoiced)", () => {
    const r = buildLeakageTrace({
      expectedBillables: [
        {
          id: "eb-ecg",
          budgetLineId: "bl-ecg",
          studyId: "STUDY-1",
          lineCode: "ECG",
          label: "ECG",
          category: "Procedure",
          visitName: "Visit 3",
          unit: "ea",
          expectedQuantity: 1,
          unitPrice: 120,
          expectedRevenue: 120,
        },
      ],
      ledgerRows: [
        {
          studyId: "STUDY-1",
          eventDate: "2026-04-04T12:00:00.000Z",
          lineCode: "ECG",
          label: "ECG",
          amount: 120,
          approved: true,
          subjectId: "SUB-001",
          visitName: "Visit 3",
          eventLogId: "evt-ecg-1",
          supportDocumentationComplete: true,
        },
      ],
      claimItems: [],
      invoicePackages: [],
    })
    const json = JSON.parse(JSON.stringify(r)) as Record<string, unknown>
    expect(json).toEqual({
      items: [
        {
          studyId: "STUDY-1",
          subjectId: "SUB-001",
          visitName: "Visit 3",
          lineCode: "ECG",
          eventLogId: "evt-ecg-1",
          expectedAmount: 120,
          invoicedAmount: 0,
          missingAmount: 120,
          status: "missing",
          reason: "not_invoiced",
          actionHint: "prepare_invoice",
        },
      ],
      summary: {
        totalExpectedAmount: 120,
        totalInvoicedAmount: 0,
        totalMissingAmount: 120,
        itemCount: 1,
        missingCount: 1,
        partialCount: 0,
        blockedCount: 0,
      },
    })
  })

  describe("missing item — expected exists, no invoice / no claim", () => {
    it("not_generated when no downstream at all; missingAmount = expectedAmount", () => {
      const expectedRevenue = 250
      const r = buildLeakageTrace({
        expectedBillables: [
          eb({
            lineCode: "V1",
            visitName: "Screening Visit",
            expectedRevenue,
            unitPrice: expectedRevenue,
          }),
        ],
      })
      expect(r.items).toHaveLength(1)
      expect(r.items[0]).toMatchObject({
        status: "missing",
        reason: "not_generated",
        expectedAmount: expectedRevenue,
        invoicedAmount: 0,
        missingAmount: expectedRevenue,
        actionHint: "check_event_mapping",
      })
    })

    it("not_invoiced when ledger exists but no claim; missingAmount = expectedAmount", () => {
      const expectedRevenue = 100
      const r = buildLeakageTrace({
        expectedBillables: [
          eb({ lineCode: "V1", visitName: "Visit 1", expectedRevenue, unitPrice: expectedRevenue }),
        ],
        ledgerRows: [ledger()],
        claimItems: [],
        invoicePackages: [],
      })
      expect(r.items).toHaveLength(1)
      expect(r.items[0]).toMatchObject({
        status: "missing",
        reason: "not_invoiced",
        missingAmount: expectedRevenue,
        expectedAmount: expectedRevenue,
        invoicedAmount: 0,
        actionHint: "prepare_invoice",
      })
    })
  })

  describe("partial invoice", () => {
    it("expected 100, invoiced 40 → missing 60, partial, partially_invoiced", () => {
      const r = buildLeakageTrace({
        expectedBillables: [
          eb({ lineCode: "V1", visitName: "Visit 1", expectedRevenue: 100, unitPrice: 100 }),
        ],
        ledgerRows: [ledger()],
        claimItems: [claim()],
        invoicePackages: [inv([invoiceLine("claim-1", 40)])],
      })
      expect(r.items).toHaveLength(1)
      expect(r.items[0]).toMatchObject({
        status: "partial",
        reason: "partially_invoiced",
        expectedAmount: 100,
        invoicedAmount: 40,
        missingAmount: 60,
        actionHint: "prepare_invoice",
      })
    })
  })

  describe("blocked claim", () => {
    it("requiresReview → not_invoice_ready, requires_review, resolve_blocking_issue", () => {
      const r = buildLeakageTrace({
        expectedBillables: [eb({ lineCode: "V1", visitName: "Visit 1" })],
        ledgerRows: [ledger()],
        claimItems: [claim({ requiresReview: true })],
        invoicePackages: [inv([invoiceLine("claim-1", 100)])],
      })
      expect(r.items[0]).toMatchObject({
        status: "not_invoice_ready",
        reason: "requires_review",
        actionHint: "resolve_blocking_issue",
      })
    })

    it("disputed status → not_invoice_ready, claim_blocked, resolve_blocking_issue", () => {
      const r = buildLeakageTrace({
        expectedBillables: [eb({ lineCode: "V1", visitName: "Visit 1" })],
        ledgerRows: [ledger()],
        claimItems: [claim({ status: "disputed", requiresReview: false })],
        invoicePackages: [],
      })
      expect(r.items[0]).toMatchObject({
        status: "not_invoice_ready",
        reason: "claim_blocked",
        actionHint: "resolve_blocking_issue",
      })
    })
  })

  describe("missing documentation", () => {
    it("claim supportDocumentationComplete false → missing_documentation, collect_documentation", () => {
      const r = buildLeakageTrace({
        expectedBillables: [eb({ lineCode: "V1", visitName: "Visit 1" })],
        ledgerRows: [ledger()],
        claimItems: [claim({ supportDocumentationComplete: false })],
        invoicePackages: [],
      })
      expect(r.items[0]).toMatchObject({
        reason: "missing_documentation",
        status: "not_invoice_ready",
        actionHint: "collect_documentation",
      })
    })

    it("ledger supportDocumentationComplete false → missing_documentation", () => {
      const r = buildLeakageTrace({
        expectedBillables: [eb({ lineCode: "V1", visitName: "Visit 1" })],
        ledgerRows: [ledger({ supportDocumentationComplete: false })],
        claimItems: [],
        invoicePackages: [],
      })
      expect(r.items[0]).toMatchObject({
        reason: "missing_documentation",
        status: "not_invoice_ready",
        actionHint: "collect_documentation",
      })
    })
  })

  describe("fully invoiced item", () => {
    it("expected = invoiced → no emitted items", () => {
      const r = buildLeakageTrace({
        expectedBillables: [eb({ lineCode: "V1", visitName: "Visit 1", expectedRevenue: 100 })],
        ledgerRows: [ledger()],
        claimItems: [claim()],
        invoicePackages: [inv([invoiceLine("claim-1", 100)])],
      })
      expect(r.items).toHaveLength(0)
      expect(r.summary.itemCount).toBe(0)
      expect(r.summary.totalExpectedAmount).toBe(0)
      expect(r.summary.totalInvoicedAmount).toBe(0)
      expect(r.summary.totalMissingAmount).toBe(0)
    })
  })

  describe("summary totals", () => {
    it("aggregates totalExpectedAmount, totalInvoicedAmount, totalMissingAmount and status counts", () => {
      const r = buildLeakageTrace({
        expectedBillables: [
          eb({
            id: "eb-a",
            lineCode: "A",
            visitName: "V1",
            expectedRevenue: 100,
            unitPrice: 100,
          }),
          eb({
            id: "eb-b",
            lineCode: "B",
            visitName: "V2",
            expectedRevenue: 200,
            unitPrice: 200,
          }),
        ],
        ledgerRows: [],
        claimItems: [],
        invoicePackages: [],
      })
      expect(r.items).toHaveLength(2)
      expect(r.summary.itemCount).toBe(2)
      expect(r.summary.totalExpectedAmount).toBe(300)
      expect(r.summary.totalInvoicedAmount).toBe(0)
      expect(r.summary.totalMissingAmount).toBe(300)
      expect(r.summary.missingCount).toBe(2)
      expect(r.summary.partialCount).toBe(0)
      expect(r.summary.blockedCount).toBe(0)
    })
  })

  describe("deterministic matching and stable ordering", () => {
    it("same inputs produce identical ordered output (run twice)", () => {
      const params = {
        expectedBillables: [
          eb({
            id: "eb-b",
            lineCode: "B",
            visitName: "Visit 2",
            expectedRevenue: 50,
            unitPrice: 50,
          }),
          eb({
            id: "eb-a",
            lineCode: "A",
            visitName: "Visit 1",
            expectedRevenue: 40,
            unitPrice: 40,
          }),
        ],
        ledgerRows: [] as ClaimsLedgerRow[],
        claimItems: [] as ClaimItem[],
        invoicePackages: [] as InvoicePackage[],
      }
      const r1 = buildLeakageTrace(params)
      const r2 = buildLeakageTrace(params)
      expect(JSON.stringify(r1.items)).toBe(JSON.stringify(r2.items))
      expect(r1.items.map((i) => i.lineCode)).toEqual(["A", "B"])
    })

    it("sorts emitted items by studyId, subjectId, visitName, lineCode", () => {
      const study = "STUDY-X"
      const mkEb = (lineCode: string, visitName: string): ExpectedBillable => ({
        id: `eb-${lineCode}-${visitName}`,
        budgetLineId: "bl",
        studyId: study,
        lineCode,
        label: lineCode,
        category: "Visit",
        visitName,
        unit: "ea",
        expectedQuantity: 1,
        unitPrice: 10,
        expectedRevenue: 10,
      })

      const r = buildLeakageTrace({
        expectedBillables: [
          mkEb("L1", "Visit B"),
          mkEb("L2", "Visit A"),
          mkEb("L1", "Visit A"),
        ],
        ledgerRows: [],
        claimItems: [],
        invoicePackages: [],
      })

      expect(r.items.map((i) => `${i.studyId}|${i.subjectId}|${i.visitName}|${i.lineCode}`)).toEqual([
        `${study}||Visit A|L1`,
        `${study}||Visit A|L2`,
        `${study}||Visit B|L1`,
      ])
    })
  })
})
