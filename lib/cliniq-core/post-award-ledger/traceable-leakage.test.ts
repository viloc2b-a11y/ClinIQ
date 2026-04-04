import { describe, expect, it } from "vitest"

import type { ClaimItem, ClaimsLedgerRow, InvoicePackage } from "../claims/types"
import type { BillableInstance } from "./types"
import { buildTraceableLeakageReport } from "./traceable-leakage"

const STUDY = "S-1"

function billable(overrides: Partial<BillableInstance> & Pick<BillableInstance, "id" | "lineCode" | "totalAmount">): BillableInstance {
  return {
    eventLogId: `evt-${overrides.id}`,
    studyId: STUDY,
    label: overrides.label ?? overrides.lineCode,
    category: "Visit",
    quantity: 1,
    unitAmount: overrides.totalAmount,
    occurredAt: "2026-01-10T12:00:00.000Z",
    ...overrides,
  }
}

function ledgerRow(
  billableId: string,
  overrides: Partial<ClaimsLedgerRow> = {},
): ClaimsLedgerRow {
  return {
    studyId: STUDY,
    eventDate: "2026-01-10T12:00:00.000Z",
    lineCode: "V1",
    label: "Visit",
    amount: 100,
    approved: true,
    billableInstanceId: billableId,
    eventLogId: `evt-${billableId}`,
    subjectId: "SUB-1",
    visitName: "V1",
    ...overrides,
  }
}

function claimForBillable(billableId: string, claimId: string, overrides: Partial<ClaimItem> = {}): ClaimItem {
  return {
    id: claimId,
    studyId: STUDY,
    eventDate: "2026-01-10T12:00:00.000Z",
    lineCode: "V1",
    label: "Visit",
    amount: 100,
    status: "ready",
    requiresReview: false,
    approved: true,
    supportDocumentationComplete: true,
    billableInstanceId: billableId,
    subjectId: "SUB-1",
    visitName: "V1",
    ...overrides,
  }
}

function emptyInvoice(lines: InvoicePackage["lines"] = []): InvoicePackage {
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

describe("buildTraceableLeakageReport", () => {
  it("happy path -> ok when invoice lines cover expected amount", () => {
    const b = billable({ id: "bill-ok", lineCode: "V1", totalAmount: 100 })
    const report = buildTraceableLeakageReport({
      studyId: STUDY,
      billableInstances: [b],
      ledgerRows: [ledgerRow("bill-ok")],
      claimItems: [claimForBillable("bill-ok", "claim-ok")],
      invoice: emptyInvoice([
        {
          id: "il-1",
          studyId: STUDY,
          sponsorId: "SP",
          eventDate: "2026-01-10",
          lineCode: "V1",
          label: "Visit",
          amount: 100,
          status: "ready",
          claimItemId: "claim-ok",
        },
      ]),
    })
    expect(report.rows).toHaveLength(1)
    expect(report.rows[0].status).toBe("ok")
    expect(report.rows[0].expectedAmount).toBe(100)
    expect(report.rows[0].invoicedAmount).toBe(100)
    expect(report.rows[0].leakageAmount).toBe(0)
    expect(report.totalExpected).toBe(100)
    expect(report.totalInvoiced).toBe(100)
    expect(report.totalLeakage).toBe(0)
  })

  it("missing ledger row", () => {
    const b = billable({ id: "bill-nl", lineCode: "V1", totalAmount: 200 })
    const report = buildTraceableLeakageReport({
      studyId: STUDY,
      billableInstances: [b],
      ledgerRows: [],
      claimItems: [],
      invoice: emptyInvoice(),
    })
    expect(report.rows[0].status).toBe("missing_ledger_row")
    expect(report.rows[0].invoicedAmount).toBe(0)
    expect(report.rows[0].leakageAmount).toBe(200)
    expect(report.totalLeakage).toBe(200)
  })

  it("missing claim item", () => {
    const b = billable({ id: "bill-nc", lineCode: "V1", totalAmount: 150 })
    const report = buildTraceableLeakageReport({
      studyId: STUDY,
      billableInstances: [b],
      ledgerRows: [ledgerRow("bill-nc")],
      claimItems: [],
      invoice: emptyInvoice(),
    })
    expect(report.rows[0].status).toBe("missing_claim_item")
    expect(report.rows[0].subjectId).toBe("SUB-1")
    expect(report.rows[0].leakageAmount).toBe(150)
  })

  it("not invoiced when claim exists but no invoice line", () => {
    const b = billable({ id: "bill-ni", lineCode: "V1", totalAmount: 80 })
    const report = buildTraceableLeakageReport({
      studyId: STUDY,
      billableInstances: [b],
      ledgerRows: [ledgerRow("bill-ni")],
      claimItems: [claimForBillable("bill-ni", "claim-ni")],
      invoice: emptyInvoice(),
    })
    expect(report.rows[0].status).toBe("not_invoiced")
    expect(report.rows[0].invoicedAmount).toBe(0)
    expect(report.rows[0].leakageAmount).toBe(80)
  })

  it("under invoiced when summed invoice lines are below expected", () => {
    const b = billable({ id: "bill-ui", lineCode: "V1", totalAmount: 100 })
    const report = buildTraceableLeakageReport({
      studyId: STUDY,
      billableInstances: [b],
      ledgerRows: [ledgerRow("bill-ui")],
      claimItems: [claimForBillable("bill-ui", "claim-ui")],
      invoice: emptyInvoice([
        {
          id: "il-u",
          studyId: STUDY,
          sponsorId: "SP",
          eventDate: "2026-01-10",
          lineCode: "V1",
          label: "Visit",
          amount: 35,
          status: "ready",
          claimItemId: "claim-ui",
        },
      ]),
    })
    expect(report.rows[0].status).toBe("under_invoiced")
    expect(report.rows[0].invoicedAmount).toBe(35)
    expect(report.rows[0].leakageAmount).toBe(65)
    expect(report.totalExpected).toBe(100)
    expect(report.totalInvoiced).toBe(35)
    expect(report.totalLeakage).toBe(65)
  })

  it("sorts by leakageAmount desc, lineCode asc, billableInstanceId asc", () => {
    const low = billable({ id: "bill-low", lineCode: "Z", totalAmount: 50, label: "z" })
    const midA = billable({ id: "bill-mida", lineCode: "M", totalAmount: 50, label: "m-a" })
    const midB = billable({ id: "bill-midb", lineCode: "M", totalAmount: 50, label: "m-b" })
    const high = billable({ id: "bill-high", lineCode: "A", totalAmount: 100, label: "a" })

    const report = buildTraceableLeakageReport({
      studyId: STUDY,
      billableInstances: [low, midA, midB, high],
      ledgerRows: [
        ledgerRow("bill-low", { lineCode: "Z", amount: 50 }),
        ledgerRow("bill-mida", { lineCode: "M", amount: 50 }),
        ledgerRow("bill-midb", { lineCode: "M", amount: 50 }),
        ledgerRow("bill-high", { lineCode: "A", amount: 100 }),
      ],
      claimItems: [
        claimForBillable("bill-low", "c-low", { lineCode: "Z" }),
        claimForBillable("bill-mida", "c-mida", { lineCode: "M" }),
        claimForBillable("bill-midb", "c-midb", { lineCode: "M" }),
        claimForBillable("bill-high", "c-high", { lineCode: "A" }),
      ],
      invoice: emptyInvoice([
        {
          id: "il-low",
          studyId: STUDY,
          sponsorId: "SP",
          eventDate: "2026-01-10",
          lineCode: "Z",
          label: "z",
          amount: 50,
          status: "ready",
          claimItemId: "c-low",
        },
        {
          id: "il-mida",
          studyId: STUDY,
          sponsorId: "SP",
          eventDate: "2026-01-10",
          lineCode: "M",
          label: "m",
          amount: 50,
          status: "ready",
          claimItemId: "c-mida",
        },
        {
          id: "il-midb",
          studyId: STUDY,
          sponsorId: "SP",
          eventDate: "2026-01-10",
          lineCode: "M",
          label: "m",
          amount: 50,
          status: "ready",
          claimItemId: "c-midb",
        },
        {
          id: "il-high",
          studyId: STUDY,
          sponsorId: "SP",
          eventDate: "2026-01-10",
          lineCode: "A",
          label: "a",
          amount: 40,
          status: "ready",
          claimItemId: "c-high",
        },
      ]),
    })

    const ids = report.rows.map((r) => r.billableInstanceId)
    expect(ids).toEqual(["bill-high", "bill-mida", "bill-midb", "bill-low"])
    expect(report.rows[0].leakageAmount).toBe(60)
    expect(report.rows[1].leakageAmount).toBe(0)
    expect(report.rows[2].leakageAmount).toBe(0)
    expect(report.rows[3].leakageAmount).toBe(0)
    expect(report.totalExpected).toBe(250)
    expect(report.totalInvoiced).toBe(190)
    expect(report.totalLeakage).toBe(60)
  })
})
