import { describe, expect, it } from "vitest"

import {
  buildAgingReport,
  buildClaimItemsFromLedger,
  buildInvoicePackage,
  detectClaimExceptions,
} from "./build-claims"
import {
  agingReportToCsv,
  claimItemsToCsv,
  invoicePackageToJson,
} from "./export-format"
import type { ClaimsLedgerRow } from "./types"

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
})
