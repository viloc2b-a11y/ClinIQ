import type { ActionCenterWriteThroughInput } from "./write-through-types"
import { writeThroughActionCenter } from "./write-through-action-center"

export async function runActionCenterSyncFromRuntime(params: {
  expectedBillables: any[]
  ledgerRows?: any[]
  claimItems?: any[]
  invoicePackages?: any[]
}) {
  return writeThroughActionCenter({
    expectedBillables: params.expectedBillables,
    ledgerRows: params.ledgerRows,
    claimItems: params.claimItems,
    invoicePackages: params.invoicePackages,
  } as ActionCenterWriteThroughInput)
}
