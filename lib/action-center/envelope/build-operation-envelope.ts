import type { ActionCenterOperationEnvelope } from "./types"
import type {
  ActionCenterVerifySummary,
  ActionCenterWriteAndVerifySummary,
  ActionCenterWriteSummary,
} from "../summary/types"

function buildOperationId(kind: string, timestamp: string): string {
  return `${kind}::${timestamp}`
}

export function buildWriteOperationEnvelope(
  summary: ActionCenterWriteSummary,
  timestamp = new Date().toISOString(),
): ActionCenterOperationEnvelope {
  return {
    operationId: buildOperationId("write", timestamp),
    timestamp,
    kind: "write",
    status: summary.status,
    summary,
  }
}

export function buildVerifyOperationEnvelope(
  summary: ActionCenterVerifySummary,
  timestamp = new Date().toISOString(),
): ActionCenterOperationEnvelope {
  return {
    operationId: buildOperationId("verify", timestamp),
    timestamp,
    kind: "verify",
    status: summary.status,
    summary,
  }
}

export function buildWriteAndVerifyOperationEnvelope(
  summary: ActionCenterWriteAndVerifySummary,
  timestamp = new Date().toISOString(),
): ActionCenterOperationEnvelope {
  return {
    operationId: buildOperationId("write_and_verify", timestamp),
    timestamp,
    kind: "write_and_verify",
    status: summary.status,
    summary,
  }
}
