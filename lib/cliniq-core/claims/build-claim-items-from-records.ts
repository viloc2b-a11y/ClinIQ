import {
  buildLedgerRowsFromBillables,
  type BillableToLedgerOptions,
} from "../post-award-ledger/billable-to-ledger"
import type { BillableInstance } from "../post-award-ledger/types"
import { buildClaimItemsFromLedger } from "./build-claims"
import type { ClaimItem, ClaimsLedgerRow } from "./types"

export type BuildClaimItemsFromRecordsInput = {
  records: BillableInstance[]
  ledgerOptions?: BillableToLedgerOptions
  /**
   * Per-record merge onto rows from {@link buildLedgerRowsFromBillables} (same length as `records`).
   * Lets callers vary sponsor/period or readiness without changing upstream modules.
   */
  ledgerRowOverrides?: Partial<ClaimsLedgerRow>[]
}

export type ClaimItemsFromRecordsResult = {
  data: ClaimItem[]
  summary: {
    total: number
    totalAmount: number
  }
  warnings: string[]
}

function mergeLedgerRows(
  base: ClaimsLedgerRow[],
  overrides: Partial<ClaimsLedgerRow>[] | undefined,
  warnings: string[],
): ClaimsLedgerRow[] {
  if (!overrides || overrides.length === 0) {
    return base
  }
  if (overrides.length !== base.length) {
    warnings.push(
      `ledgerRowOverrides length (${overrides.length}) does not match records (${base.length}); overrides ignored.`,
    )
    return base
  }
  return base.map((row, i) => ({ ...row, ...overrides[i] }))
}

/**
 * STEP 81 — Build {@link ClaimItem}s from persisted {@link BillableInstance} records.
 * Traceability: {@link ClaimItem.billableInstanceId} / {@link ClaimItem.eventLogId} from each record.
 */
export function buildClaimItemsFromRecords(
  input: BuildClaimItemsFromRecordsInput,
): ClaimItemsFromRecordsResult {
  const warnings: string[] = []
  if (input.records.length === 0) {
    warnings.push("No billable records provided.")
    return {
      data: [],
      summary: { total: 0, totalAmount: 0 },
      warnings,
    }
  }

  const baseRows = buildLedgerRowsFromBillables(input.records, input.ledgerOptions)
  const ledgerRows = mergeLedgerRows(baseRows, input.ledgerRowOverrides, warnings)
  const data = buildClaimItemsFromLedger(ledgerRows)
  const totalAmount = data.reduce((s, c) => s + c.amount, 0)

  return {
    data,
    summary: {
      total: data.length,
      totalAmount,
    },
    warnings,
  }
}
