import type { ClaimItem, ClaimsLedgerRow, InvoicePackage } from "../claims/types"
import type { BillableInstance } from "./types"

export type LeakageTraceStatus =
  | "missing_ledger_row"
  | "missing_claim_item"
  | "not_invoiced"
  | "under_invoiced"
  | "ok"

export type TraceableLeakageRow = {
  studyId: string
  lineCode: string
  label: string
  billableInstanceId?: string
  eventLogId?: string
  subjectId?: string
  visitName?: string
  expectedAmount: number
  invoicedAmount: number
  leakageAmount: number
  status: LeakageTraceStatus
}

export type TraceableLeakageReport = {
  studyId: string
  totalExpected: number
  totalInvoiced: number
  totalLeakage: number
  rows: TraceableLeakageRow[]
}

export function buildTraceableLeakageReport(args: {
  studyId: string
  billableInstances: BillableInstance[]
  ledgerRows: ClaimsLedgerRow[]
  claimItems: ClaimItem[]
  invoice: InvoicePackage
}): TraceableLeakageReport {
  const { studyId, billableInstances, ledgerRows, claimItems, invoice } = args

  const rows: TraceableLeakageRow[] = billableInstances.map((b) => {
    const expectedAmount = b.totalAmount
    const ledger = ledgerRows.find((r) => r.billableInstanceId === b.id)

    if (ledger === undefined) {
      return {
        studyId,
        lineCode: b.lineCode,
        label: b.label,
        billableInstanceId: b.id,
        eventLogId: b.eventLogId,
        subjectId: undefined,
        visitName: undefined,
        expectedAmount,
        invoicedAmount: 0,
        leakageAmount: Math.max(0, expectedAmount - 0),
        status: "missing_ledger_row" as const,
      }
    }

    const claim = claimItems.find((c) => c.billableInstanceId === b.id)
    if (claim === undefined) {
      return {
        studyId,
        lineCode: b.lineCode,
        label: b.label,
        billableInstanceId: b.id,
        eventLogId: b.eventLogId,
        subjectId: ledger.subjectId,
        visitName: ledger.visitName,
        expectedAmount,
        invoicedAmount: 0,
        leakageAmount: Math.max(0, expectedAmount - 0),
        status: "missing_claim_item" as const,
      }
    }

    const invLines = invoice.lines.filter((l) => l.claimItemId === claim.id)
    const invoicedAmount = invLines.reduce((s, l) => s + l.amount, 0)

    if (invLines.length === 0) {
      return {
        studyId,
        lineCode: b.lineCode,
        label: b.label,
        billableInstanceId: b.id,
        eventLogId: b.eventLogId,
        subjectId: ledger.subjectId ?? claim.subjectId,
        visitName: ledger.visitName ?? claim.visitName,
        expectedAmount,
        invoicedAmount: 0,
        leakageAmount: Math.max(0, expectedAmount - 0),
        status: "not_invoiced" as const,
      }
    }

    let status: LeakageTraceStatus
    if (invoicedAmount < expectedAmount) {
      status = "under_invoiced"
    } else {
      status = "ok"
    }

    return {
      studyId,
      lineCode: b.lineCode,
      label: b.label,
      billableInstanceId: b.id,
      eventLogId: b.eventLogId,
      subjectId: ledger.subjectId ?? claim.subjectId,
      visitName: ledger.visitName ?? claim.visitName,
      expectedAmount,
      invoicedAmount,
      leakageAmount: Math.max(0, expectedAmount - invoicedAmount),
      status,
    }
  })

  rows.sort((a, b) => {
    if (b.leakageAmount !== a.leakageAmount) return b.leakageAmount - a.leakageAmount
    if (a.lineCode !== b.lineCode) return a.lineCode.localeCompare(b.lineCode)
    const idA = a.billableInstanceId ?? ""
    const idB = b.billableInstanceId ?? ""
    return idA.localeCompare(idB)
  })

  const totalExpected = rows.reduce((s, r) => s + r.expectedAmount, 0)
  const totalInvoiced = rows.reduce((s, r) => s + r.invoicedAmount, 0)
  const totalLeakage = rows.reduce((s, r) => s + r.leakageAmount, 0)

  return {
    studyId,
    totalExpected,
    totalInvoiced,
    totalLeakage,
    rows,
  }
}
