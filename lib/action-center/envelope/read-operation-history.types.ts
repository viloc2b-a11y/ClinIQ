import type { ActionCenterOperationStatus } from "../summary/types"

export type ReadOperationHistoryInput = {
  kind?: "write" | "verify" | "write_and_verify"
  status?: ActionCenterOperationStatus
  limit?: number
}
