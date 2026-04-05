import type { ExpectedBillable } from "../post-award-ledger/types"
import type { ActionCenterItem } from "./types"

export interface ActionCenterWriteThroughInput {
  expectedBillables: ExpectedBillable[]
  ledgerRows?: any[]
  claimItems?: any[]
  invoicePackages?: any[]
}

export interface ActionCenterWriteThroughResult {
  items: ActionCenterItem[]
  insertedCount: number
  updatedCount: number
  unchangedCount: number
}
