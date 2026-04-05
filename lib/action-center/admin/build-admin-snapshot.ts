import type { ActionCenterAuditEntry } from "../audit/store/types"
import type { ActionCenterOperationEnvelope } from "../envelope/types"
import type { ActionCenterMetrics } from "../metrics/store/types"
import type { ActionCenterRecord } from "../persistence/types"
import type { ActionCenterAdminSnapshot } from "./types"

export function buildActionCenterAdminSnapshot(input: {
  generatedAt?: string
  records: ActionCenterRecord[]
  operations: ActionCenterOperationEnvelope[]
  audit: ActionCenterAuditEntry[]
  metrics: ActionCenterMetrics
}): ActionCenterAdminSnapshot {
  const generatedAt = input.generatedAt || new Date().toISOString()

  const recordsByType: Record<string, number> = {}
  for (const record of input.records) {
    recordsByType[record.type] = (recordsByType[record.type] || 0) + 1
  }

  const operationsByKind: Record<"write" | "verify" | "write_and_verify", number> = {
    write: 0,
    verify: 0,
    write_and_verify: 0,
  }

  const operationsByStatus: Record<
    "success" | "partial" | "failed" | "verification_failed",
    number
  > = {
    success: 0,
    partial: 0,
    failed: 0,
    verification_failed: 0,
  }

  for (const operation of input.operations) {
    operationsByKind[operation.kind] += 1
    operationsByStatus[operation.status] += 1
  }

  const auditByStep: Record<"write_attempt" | "write_success" | "write_fail", number> = {
    write_attempt: 0,
    write_success: 0,
    write_fail: 0,
  }

  for (const entry of input.audit) {
    auditByStep[entry.step] += 1
  }

  return {
    generatedAt,
    records: {
      total: input.records.length,
      byType: recordsByType,
    },
    operations: {
      total: input.operations.length,
      byKind: operationsByKind,
      byStatus: operationsByStatus,
    },
    audit: {
      total: input.audit.length,
      byStep: auditByStep,
    },
    metrics: input.metrics,
  }
}
