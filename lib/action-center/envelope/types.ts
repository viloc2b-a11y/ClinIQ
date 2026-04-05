import type {
  ActionCenterOperationStatus,
  ActionCenterVerifySummary,
  ActionCenterWriteAndVerifySummary,
  ActionCenterWriteSummary,
} from "../summary/types"

export type ActionCenterOperationKind =
  | "write"
  | "verify"
  | "write_and_verify"

export type ActionCenterOperationEnvelope =
  | {
      operationId: string
      timestamp: string
      kind: "write"
      status: ActionCenterOperationStatus
      summary: ActionCenterWriteSummary
    }
  | {
      operationId: string
      timestamp: string
      kind: "verify"
      status: ActionCenterOperationStatus
      summary: ActionCenterVerifySummary
    }
  | {
      operationId: string
      timestamp: string
      kind: "write_and_verify"
      status: ActionCenterOperationStatus
      summary: ActionCenterWriteAndVerifySummary
    }
