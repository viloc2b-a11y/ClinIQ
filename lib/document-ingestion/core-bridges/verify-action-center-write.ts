/**
 * Document Engine v1 — read-back verification: list Action Center items and match expected client refs (no mutation).
 *
 * Persisted {@link ActionCenterItem} carries the boundary row primary key as {@link ActionCenterItem.id}.
 * That matches {@link boundaryRowClientRef} for rows produced by {@link toEventStoreBoundaryInput}
 * (id and metadata.documentEngine.clientEventId are the write-input client id).
 */

import type { ActionCenterItem } from "../../cliniq-core/action-center/types"
import type { ActionCenterPersistenceAdapter } from "../../cliniq-core/action-center/persistence-adapter"

const WARN_SOME_MISSING = "Some expected action items were not found in Action Center."

/**
 * Client ref(s) observable on a persisted Action Center item. Today this is {@link ActionCenterItem.id} only;
 * metadata is not stored on {@link ActionCenterItem} by the persistence row→item mapper.
 */
export function actionCenterItemPersistedClientRefs(item: ActionCenterItem): string[] {
  const id = item.id
  if (typeof id === "string" && id.length > 0) {
    return [id]
  }
  return []
}

export type VerifyActionCenterWriteInput = {
  adapter: ActionCenterPersistenceAdapter
  expectedClientRefs: string[]
}

export type VerifyActionCenterWriteResult = {
  totalExpected: number
  found: number
  missing: string[]
  matched: Array<{
    clientRef: string
    status: "found"
  }>
  warnings: string[]
}

export async function verifyActionCenterWrite(
  input: VerifyActionCenterWriteInput,
): Promise<VerifyActionCenterWriteResult> {
  const items = await input.adapter.listActionItems()
  const foundSet = new Set<string>()
  for (const item of items) {
    for (const ref of actionCenterItemPersistedClientRefs(item)) {
      foundSet.add(ref)
    }
  }

  const matched: VerifyActionCenterWriteResult["matched"] = []
  const missing: string[] = []

  for (const ref of input.expectedClientRefs) {
    if (foundSet.has(ref)) {
      matched.push({ clientRef: ref, status: "found" })
    } else {
      missing.push(ref)
    }
  }

  const warnings: string[] = []
  if (missing.length > 0) {
    warnings.push(WARN_SOME_MISSING)
  }

  return {
    totalExpected: input.expectedClientRefs.length,
    found: matched.length,
    missing,
    matched,
    warnings,
  }
}

/* Record-store lane (lib/action-center/persistence) — additive; cliniq-core path unchanged above. */
export { readActionCenterRecords } from "../../action-center/read-action-center-records"
export { readActionCenterRecordsPage } from "../../action-center/read-action-center-records-page"
export { verifyActionCenterRecords } from "../../action-center/verify-action-center-records"
export { verifyActionCenterRecordsPaged } from "../../action-center/verify-action-center-records-paged"
export { verifyActionCenterRecordsUnified } from "../../action-center/verify-action-center-records-unified"
export { buildActionCenterVerificationResult } from "../../action-center/verification/build-verification-result"
export {
  buildDeterministicId,
  writeActionCenterRecords,
} from "../../action-center/write-action-center-records"
export { writeAndVerifyActionCenterRecords } from "../../action-center/write-and-verify-action-center-records"
export {
  getWriteAndVerifyStatus,
  getVerifyStatus,
  getWriteStatus,
} from "../../action-center/summary/status"
export type {
  ActionCenterOperationStatus,
  ActionCenterVerifySummary,
  ActionCenterWriteAndVerifySummary,
  ActionCenterWriteSummary,
} from "../../action-center/summary/types"
export type {
  ActionCenterOperationKind,
  ActionCenterOperationEnvelope,
} from "../../action-center/envelope/types"
export {
  buildWriteOperationEnvelope,
  buildVerifyOperationEnvelope,
  buildWriteAndVerifyOperationEnvelope,
} from "../../action-center/envelope/build-operation-envelope"
export {
  writeActionCenterRecordsWithEnvelope,
  verifyActionCenterRecordsWithEnvelope,
  writeAndVerifyActionCenterRecordsWithEnvelope,
} from "../../action-center/envelope/builders"
export type { ReadOperationHistoryInput } from "../../action-center/envelope/read-operation-history.types"
export type {
  ReadOperationHistoryPageInput,
  ReadOperationHistoryPageResult,
} from "../../action-center/envelope/history-pagination"
export { readOperationHistoryPage } from "../../action-center/envelope/read-operation-history-page"
export {
  decodeOperationHistoryCursor,
  encodeOperationHistoryCursor,
  filterOperationHistoryRows,
  paginateOperationHistoryRows,
  sortOperationHistoryRows,
} from "../../action-center/envelope/history-pagination"
export {
  decodeActionCenterCursor,
  encodeActionCenterCursor,
} from "../../action-center/pagination/cursor"
export type {
  OperationEnvelopeStore,
  OperationEnvelopeStoreListInput,
  OperationEnvelopeStorePageInput,
  OperationEnvelopeStorePageResult,
} from "../../action-center/envelope/store/types"
export { MemoryOperationEnvelopeStore } from "../../action-center/envelope/store/memory-operation-envelope-store"
export { SupabaseOperationEnvelopeStore } from "../../action-center/envelope/store/supabase-operation-envelope-store"
export {
  getOperationEnvelopeStore,
  resetOperationEnvelopeStoreCache,
} from "../../action-center/envelope/store/get-store"
export type {
  ActionCenterAuditStore,
  AuditStoreListInput,
  AuditStorePageInput,
  AuditStorePageResult,
} from "../../action-center/audit/store/types"
export { MemoryActionCenterAuditStore } from "../../action-center/audit/store/memory-audit-store"
export { SupabaseActionCenterAuditStore } from "../../action-center/audit/store/supabase-audit-store"
export {
  getActionCenterAuditStore,
  resetActionCenterAuditStoreCache,
} from "../../action-center/audit/store/get-store"
export { readAuditLog } from "../../action-center/read-audit-log"
export { readAuditLogPage } from "../../action-center/read-audit-log-page"
export {
  decodeAuditCursor,
  encodeAuditCursor,
  filterAuditRows,
  paginateAuditRows,
  sortAuditRows,
} from "../../action-center/audit/pagination"
export type {
  ActionCenterMetrics,
  ActionCenterMetricsStore,
} from "../../action-center/metrics/store/types"
export { MemoryActionCenterMetricsStore } from "../../action-center/metrics/store/memory-metrics-store"
export {
  getActionCenterMetricsStore,
  resetActionCenterMetricsStoreCache,
} from "../../action-center/metrics/store/get-store"
