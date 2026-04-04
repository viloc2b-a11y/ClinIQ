import { describe, expect, it } from "vitest"

import { buildExecutionLinesFromClaimsLedger } from "../post-award-ledger/execution-line-builder"
import {
  buildAgingReport,
  buildClaimItemsCanonical,
  buildClaimItemsFromExecutionLines,
  buildClaimItemsFromLedger,
  buildInvoicePackage,
  detectClaimExceptions,
} from "./build-claims"
import {
  agingReportToCsv,
  claimItemsToCsv,
  invoicePackageToJson,
} from "./export-format"
import type { ClaimItem, ClaimsLedgerRow } from "./types"

function readyRow(
  overrides: Partial<ClaimsLedgerRow> & Pick<ClaimsLedgerRow, "lineCode" | "amount" | "eventDate">,
): ClaimsLedgerRow {
  return {
    studyId: "S-GRP",
    sponsorId: "SP-A",
    subjectId: "SUB-1",
    visitName: "V",
    label: overrides.lineCode,
    approved: true,
    supportDocumentationComplete: true,
    billableInstanceId: `bill-${overrides.lineCode}-${overrides.eventDate}`,
    eventLogId: `evt-${overrides.lineCode}`,
    ...overrides,
  }
}

describe("claims / invoice layer", () => {
  it("buildInvoicePackage groups by sponsor, study, and invoice period", () => {
    const ledger: ClaimsLedgerRow[] = [
      readyRow({
        lineCode: "A1",
        amount: 100,
        eventDate: "2026-01-05T12:00:00.000Z",
        invoicePeriodStart: "2026-01-01",
        invoicePeriodEnd: "2026-01-31",
      }),
      readyRow({
        lineCode: "A2",
        amount: 200,
        eventDate: "2026-01-06T12:00:00.000Z",
        invoicePeriodStart: "2026-01-01",
        invoicePeriodEnd: "2026-01-31",
        billableInstanceId: "bill-A2",
        eventLogId: "evt-A2",
      }),
      readyRow({
        lineCode: "B1",
        amount: 300,
        eventDate: "2026-02-01T12:00:00.000Z",
        invoicePeriodStart: "2026-02-01",
        invoicePeriodEnd: "2026-02-28",
        billableInstanceId: "bill-B1",
        eventLogId: "evt-B1",
      }),
    ]
    const claimItems = buildClaimItemsFromLedger(ledger)
    const packages = buildInvoicePackage({
      claimItems,
      generatedAt: "2026-03-01T00:00:00.000Z",
    })
    expect(packages).toHaveLength(2)
    const jan = packages.find((p) => p.invoicePeriodStart === "2026-01-01")!
    const feb = packages.find((p) => p.invoicePeriodStart === "2026-02-01")!
    expect(jan.subtotal).toBe(300)
    expect(jan.lineCount).toBe(2)
    expect(feb.subtotal).toBe(300)
    expect(feb.lineCount).toBe(1)
    expect(jan.hasBlockingIssues).toBe(false)
    expect(feb.hasBlockingIssues).toBe(false)
  })

  it("detectClaimExceptions flags missing documentation, disputed, and overdue", () => {
    const ledger: ClaimsLedgerRow[] = [
      readyRow({
        lineCode: "OK",
        amount: 50,
        eventDate: "2026-03-01T12:00:00.000Z",
        billableInstanceId: "bill-ok",
        eventLogId: "evt-ok",
      }),
      readyRow({
        lineCode: "NODOC",
        amount: 40,
        eventDate: "2026-03-02T12:00:00.000Z",
        supportDocumentationComplete: false,
        billableInstanceId: "bill-nodoc",
        eventLogId: "evt-nodoc",
      }),
      readyRow({
        lineCode: "DIS",
        amount: 60,
        eventDate: "2026-03-03T12:00:00.000Z",
        disputed: true,
        disputeReason: "Sponsor disagreement",
        billableInstanceId: "bill-dis",
        eventLogId: "evt-dis",
      }),
      readyRow({
        lineCode: "OD",
        amount: 70,
        eventDate: "2026-01-01T12:00:00.000Z",
        markedOverdue: true,
        billableInstanceId: "bill-od",
        eventLogId: "evt-od",
      }),
    ]
    const claimItems = buildClaimItemsFromLedger(ledger)
    const exc = detectClaimExceptions({ claimItems })
    const reasons = exc.map((e) => e.lineCode).sort()
    expect(reasons).toContain("NODOC")
    expect(reasons).toContain("DIS")
    expect(reasons).toContain("OD")
    expect(exc.find((e) => e.lineCode === "OK")).toBeUndefined()
  })

  it("buildAgingReport includes overdue items and stale review queue", () => {
    const ledger: ClaimsLedgerRow[] = [
      readyRow({
        lineCode: "OD",
        amount: 100,
        eventDate: "2025-10-01T12:00:00.000Z",
        markedOverdue: true,
        billableInstanceId: "bill-od2",
        eventLogId: "evt-od2",
      }),
      readyRow({
        lineCode: "STALE",
        amount: 25,
        eventDate: "2026-03-01T12:00:00.000Z",
        approved: false,
        billableInstanceId: "bill-stale",
        eventLogId: "evt-stale",
      }),
    ]
    const claimItems = buildClaimItemsFromLedger(ledger)
    const aging = buildAgingReport({
      claimItems,
      asOf: "2026-04-15T00:00:00.000Z",
      reviewAgingDays: 14,
    })
    expect(aging.some((a) => a.lineCode === "OD" && a.status === "overdue")).toBe(
      true,
    )
    expect(
      aging.some((a) => a.lineCode === "STALE" && a.id.includes("review")),
    ).toBe(true)
    expect(aging[0].daysOutstanding).toBeGreaterThanOrEqual(aging[1]?.daysOutstanding ?? 0)
  })

  it("export formatting: CSV headers, JSON round-trip", () => {
    const ledger: ClaimsLedgerRow[] = [
      readyRow({
        lineCode: 'X",Y',
        amount: 10,
        eventDate: "2026-01-01T12:00:00.000Z",
        billableInstanceId: "bill-xy",
        eventLogId: "evt-xy",
      }),
    ]
    const claimItems = buildClaimItemsFromLedger(ledger)
    const csv = claimItemsToCsv(claimItems)
    expect(csv.split("\n")[0]).toContain("lineCode")
    expect(csv).toContain('""')

    const pkgs = buildInvoicePackage({ claimItems, generatedAt: "2026-01-02T00:00:00.000Z" })
    const json = invoicePackageToJson(pkgs)
    expect(JSON.parse(json)).toHaveLength(1)

    const aging = buildAgingReport({
      claimItems,
      asOf: "2026-06-01T00:00:00.000Z",
    })
    const acsv = agingReportToCsv(aging)
    expect(acsv.split("\n")[0]).toContain("daysOutstanding")
  })

  it("buildClaimItemsCanonical uses executionLines when non-empty", () => {
    const ledger = [
      readyRow({
        lineCode: "E1",
        amount: 42,
        eventDate: "2026-04-01T12:00:00.000Z",
        billableInstanceId: "bill-e1",
        eventLogId: "evt-e1",
      }),
    ]
    const lines = buildExecutionLinesFromClaimsLedger(ledger)
    const a = buildClaimItemsCanonical({ executionLines: lines })
    const b = buildClaimItemsFromExecutionLines(lines)
    expect(a).toEqual(b)
  })

  it("buildClaimItemsCanonical maps ledgerRows via execution-line builder only", () => {
    const ledger = [
      readyRow({
        lineCode: "CAN",
        amount: 55,
        eventDate: "2026-04-02T12:00:00.000Z",
        billableInstanceId: "bill-can",
        eventLogId: "evt-can",
      }),
    ]
    const expected = buildClaimItemsFromExecutionLines(
      buildExecutionLinesFromClaimsLedger(ledger),
    )
    expect(buildClaimItemsCanonical({ ledgerRows: ledger })).toEqual(expected)
  })

  it("canonical ledger path differs from legacy on overdue (execution uses partial, not overdue)", () => {
    const row = readyRow({
      lineCode: "OD-CAN",
      amount: 70,
      eventDate: "2026-01-01T12:00:00.000Z",
      markedOverdue: true,
      billableInstanceId: "bill-od-can",
      eventLogId: "evt-od-can",
    })
    const legacy = buildClaimItemsFromLedger([row])[0]
    const canonical = buildClaimItemsCanonical({ ledgerRows: [row] })[0]
    expect(legacy.status).toBe("overdue")
    expect(canonical.status).toBe("partial")
  })

  it("buildInvoicePackage works with ledgerRows only (canonical path)", () => {
    const ledger: ClaimsLedgerRow[] = [
      readyRow({
        lineCode: "LR1",
        amount: 100,
        eventDate: "2026-01-05T12:00:00.000Z",
        invoicePeriodStart: "2026-01-01",
        invoicePeriodEnd: "2026-01-31",
        billableInstanceId: "bill-lr1",
        eventLogId: "evt-lr1",
      }),
      readyRow({
        lineCode: "LR2",
        amount: 200,
        eventDate: "2026-01-06T12:00:00.000Z",
        invoicePeriodStart: "2026-01-01",
        invoicePeriodEnd: "2026-01-31",
        billableInstanceId: "bill-lr2",
        eventLogId: "evt-lr2",
      }),
    ]
    const packages = buildInvoicePackage({
      ledgerRows: ledger,
      generatedAt: "2026-03-01T00:00:00.000Z",
    })
    expect(packages).toHaveLength(1)
    expect(packages[0].subtotal).toBe(300)
    expect(packages[0].lineCount).toBe(2)
  })

  it("buildInvoicePackage: claimItems beat executionLines and ledgerRows", () => {
    const prebuilt: ClaimItem = {
      id: "claim-prebuilt-only",
      studyId: "S-GRP",
      sponsorId: "SP-A",
      eventDate: "2026-01-10T12:00:00.000Z",
      lineCode: "PRE",
      label: "PRE",
      amount: 999,
      status: "ready",
      requiresReview: false,
      approved: true,
      supportDocumentationComplete: true,
      invoicePeriodStart: "2026-01-01",
      invoicePeriodEnd: "2026-01-31",
    }
    const ledgerHigh = readyRow({
      lineCode: "H",
      amount: 500,
      eventDate: "2026-01-06T12:00:00.000Z",
      invoicePeriodStart: "2026-01-01",
      invoicePeriodEnd: "2026-01-31",
      billableInstanceId: "bill-h",
      eventLogId: "evt-h",
    })
    const execLines = buildExecutionLinesFromClaimsLedger([ledgerHigh])
    const ledgerLow = readyRow({
      lineCode: "L",
      amount: 50,
      eventDate: "2026-01-07T12:00:00.000Z",
      invoicePeriodStart: "2026-01-01",
      invoicePeriodEnd: "2026-01-31",
      billableInstanceId: "bill-l",
      eventLogId: "evt-l",
    })
    const pkgs = buildInvoicePackage({
      claimItems: [prebuilt],
      executionLines: execLines,
      ledgerRows: [ledgerLow],
      generatedAt: "2026-03-01T00:00:00.000Z",
    })
    expect(pkgs).toHaveLength(1)
    expect(pkgs[0].subtotal).toBe(999)
  })

  it("buildInvoicePackage: executionLines beat ledgerRows when claimItems empty", () => {
    const ledgerHigh = readyRow({
      lineCode: "H2",
      amount: 500,
      eventDate: "2026-01-06T12:00:00.000Z",
      invoicePeriodStart: "2026-01-01",
      invoicePeriodEnd: "2026-01-31",
      billableInstanceId: "bill-h2",
      eventLogId: "evt-h2",
    })
    const ledgerLow = readyRow({
      lineCode: "L2",
      amount: 50,
      eventDate: "2026-01-07T12:00:00.000Z",
      invoicePeriodStart: "2026-01-01",
      invoicePeriodEnd: "2026-01-31",
      billableInstanceId: "bill-l2",
      eventLogId: "evt-l2",
    })
    const execLines = buildExecutionLinesFromClaimsLedger([ledgerHigh])
    const pkgs = buildInvoicePackage({
      claimItems: [],
      executionLines: execLines,
      ledgerRows: [ledgerLow],
      generatedAt: "2026-03-01T00:00:00.000Z",
    })
    expect(pkgs).toHaveLength(1)
    expect(pkgs[0].subtotal).toBe(500)
  })

  it("buildInvoicePackage hasBlockingIssues false when cohort is all ready lines", () => {
    const ledger: ClaimsLedgerRow[] = [
      readyRow({
        lineCode: "R1",
        amount: 10,
        eventDate: "2026-05-01T12:00:00.000Z",
        invoicePeriodStart: "2026-05-01",
        invoicePeriodEnd: "2026-05-31",
        billableInstanceId: "bill-r1",
        eventLogId: "evt-r1",
      }),
    ]
    const pkgs = buildInvoicePackage({
      ledgerRows: ledger,
      generatedAt: "2026-06-01T00:00:00.000Z",
    })
    expect(pkgs).toHaveLength(1)
    expect(pkgs[0].hasBlockingIssues).toBe(false)
  })

  it("buildInvoicePackage hasBlockingIssues true when cohort has partial line (canonical)", () => {
    const ledger: ClaimsLedgerRow[] = [
      readyRow({
        lineCode: "OK-P",
        amount: 100,
        eventDate: "2026-05-02T12:00:00.000Z",
        invoicePeriodStart: "2026-05-01",
        invoicePeriodEnd: "2026-05-31",
        billableInstanceId: "bill-okp",
        eventLogId: "evt-okp",
      }),
      readyRow({
        lineCode: "BAD-P",
        amount: 40,
        eventDate: "2026-05-03T12:00:00.000Z",
        invoicePeriodStart: "2026-05-01",
        invoicePeriodEnd: "2026-05-31",
        approved: false,
        billableInstanceId: "bill-badp",
        eventLogId: "evt-badp",
      }),
    ]
    const pkgs = buildInvoicePackage({
      ledgerRows: ledger,
      generatedAt: "2026-06-01T00:00:00.000Z",
    })
    expect(pkgs).toHaveLength(1)
    expect(pkgs[0].hasBlockingIssues).toBe(true)
  })

  it("buildInvoicePackage hasBlockingIssues true when cohort has disputed line", () => {
    const ledger: ClaimsLedgerRow[] = [
      readyRow({
        lineCode: "OK-D",
        amount: 100,
        eventDate: "2026-05-04T12:00:00.000Z",
        invoicePeriodStart: "2026-05-01",
        invoicePeriodEnd: "2026-05-31",
        billableInstanceId: "bill-okd",
        eventLogId: "evt-okd",
      }),
      readyRow({
        lineCode: "DIS-D",
        amount: 60,
        eventDate: "2026-05-05T12:00:00.000Z",
        invoicePeriodStart: "2026-05-01",
        invoicePeriodEnd: "2026-05-31",
        disputed: true,
        disputeReason: "Sponsor hold",
        billableInstanceId: "bill-disd",
        eventLogId: "evt-disd",
      }),
    ]
    const pkgs = buildInvoicePackage({
      ledgerRows: ledger,
      generatedAt: "2026-06-01T00:00:00.000Z",
    })
    expect(pkgs).toHaveLength(1)
    expect(pkgs[0].hasBlockingIssues).toBe(true)
  })

  it("buildInvoicePackage hasBlockingIssues true when cohort has requiresReview (overdue + ready)", () => {
    const ledger: ClaimsLedgerRow[] = [
      readyRow({
        lineCode: "OK-OD",
        amount: 100,
        eventDate: "2026-05-06T12:00:00.000Z",
        invoicePeriodStart: "2026-05-01",
        invoicePeriodEnd: "2026-05-31",
        billableInstanceId: "bill-okod",
        eventLogId: "evt-okod",
      }),
      readyRow({
        lineCode: "OD-ONLY",
        amount: 70,
        eventDate: "2026-05-07T12:00:00.000Z",
        invoicePeriodStart: "2026-05-01",
        invoicePeriodEnd: "2026-05-31",
        markedOverdue: true,
        billableInstanceId: "bill-odonly",
        eventLogId: "evt-odonly",
      }),
    ]
    const pkgs = buildInvoicePackage({
      ledgerRows: ledger,
      generatedAt: "2026-06-01T00:00:00.000Z",
    })
    expect(pkgs).toHaveLength(1)
    expect(pkgs[0].hasBlockingIssues).toBe(true)
  })

  it("buildInvoicePackage hasBlockingIssues true for canonical path with missing docs cohort", () => {
    const ledger: ClaimsLedgerRow[] = [
      readyRow({
        lineCode: "OK-NO",
        amount: 100,
        eventDate: "2026-05-08T12:00:00.000Z",
        invoicePeriodStart: "2026-05-01",
        invoicePeriodEnd: "2026-05-31",
        billableInstanceId: "bill-okno",
        eventLogId: "evt-okno",
      }),
      readyRow({
        lineCode: "NODOC-PKG",
        amount: 40,
        eventDate: "2026-05-09T12:00:00.000Z",
        invoicePeriodStart: "2026-05-01",
        invoicePeriodEnd: "2026-05-31",
        supportDocumentationComplete: false,
        billableInstanceId: "bill-nodocpkg",
        eventLogId: "evt-nodocpkg",
      }),
    ]
    const pkgs = buildInvoicePackage({
      ledgerRows: ledger,
      generatedAt: "2026-06-01T00:00:00.000Z",
    })
    expect(pkgs).toHaveLength(1)
    expect(pkgs[0].hasBlockingIssues).toBe(true)
  })
})
