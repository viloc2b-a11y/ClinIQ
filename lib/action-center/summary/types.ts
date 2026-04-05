export type ActionCenterOperationStatus =
  | "success"
  | "partial"
  | "failed"
  | "verification_failed"

export type ActionCenterWriteSummary = {
  status: ActionCenterOperationStatus
  ok: boolean
  partial: boolean
  attempted: number
  written: number
}

export type ActionCenterVerifySummary = {
  status: ActionCenterOperationStatus
  totalExpected: number
  found: number
  missing: string[]
  matched: string[]
  warnings: string[]
  mode: "full" | "paged"
  pagesScanned?: number
}

export type ActionCenterWriteAndVerifySummary = {
  status: ActionCenterOperationStatus
  ok: boolean
  write: ActionCenterWriteSummary
  verify: ActionCenterVerifySummary
}
