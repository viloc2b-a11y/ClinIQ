import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { resetActionCenterAuditStoreCache } from "../audit/store/get-store"
import {
  verifyActionCenterRecordsWithEnvelope,
  writeActionCenterRecordsWithEnvelope,
} from "../envelope/builders"
import { resetOperationEnvelopeHistory } from "../envelope/history-store"
import { resetOperationEnvelopeStoreCache } from "../envelope/store/get-store"
import { resetActionCenterMetricsStoreCache } from "../metrics/store/get-store"
import { resetPersistenceAdapterCache } from "../persistence/get-adapter"
import { resetAuditLog } from "../audit-log"
import { resetMetrics } from "../metrics"
import { readActionCenterAdminSnapshot } from "./read-admin-snapshot"

describe("readActionCenterAdminSnapshot", () => {
  beforeEach(async () => {
    delete process.env.CLINIQ_ENABLE_REAL_PERSISTENCE
    delete process.env.CLINIQ_ENABLE_REAL_ENVELOPE_STORE
    delete process.env.CLINIQ_ENABLE_REAL_AUDIT_STORE
    delete process.env.CLINIQ_ENABLE_REAL_METRICS_STORE

    resetPersistenceAdapterCache()
    resetOperationEnvelopeStoreCache()
    resetActionCenterAuditStoreCache()
    resetActionCenterMetricsStoreCache()

    await resetOperationEnvelopeHistory()
    await resetAuditLog()
    await resetMetrics()
  })

  afterEach(async () => {
    await resetOperationEnvelopeHistory()
    await resetAuditLog()
    await resetMetrics()
    resetPersistenceAdapterCache()
    resetOperationEnvelopeStoreCache()
    resetActionCenterAuditStoreCache()
    resetActionCenterMetricsStoreCache()
  })

  it("reads unified admin snapshot", async () => {
    await writeActionCenterRecordsWithEnvelope({
      records: [
        {
          id: "raw-1",
          type: "action_item",
          payload: { id: "A" },
          createdAt: "2026-04-05T00:00:00.000Z",
        },
      ],
      timestamp: "2026-04-05T00:00:00.000Z",
    })

    await verifyActionCenterRecordsWithEnvelope({
      expectedIds: ["action_item::A"],
      mode: "full",
      timestamp: "2026-04-05T00:00:01.000Z",
    })

    const snapshot = await readActionCenterAdminSnapshot()

    expect(snapshot.records.total).toBe(1)
    expect(snapshot.records.byType.action_item).toBe(1)

    expect(snapshot.operations.total).toBe(2)
    expect(snapshot.operations.byKind.write).toBe(1)
    expect(snapshot.operations.byKind.verify).toBe(1)

    expect(snapshot.audit.total).toBeGreaterThan(0)

    expect(snapshot.metrics).toEqual({
      writesAttempted: 1,
      writesSuccess: 1,
      writesFailed: 0,
    })
  })
})
