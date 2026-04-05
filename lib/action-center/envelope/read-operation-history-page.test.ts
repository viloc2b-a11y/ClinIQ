import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { resetSupabaseClientCache } from "../../integrations/supabase/client"
import { resetAuditLog } from "../audit-log"
import { resetMetrics } from "../metrics"
import { resetPersistenceAdapterCache } from "../persistence/get-adapter"
import {
  verifyActionCenterRecordsWithEnvelope,
  writeActionCenterRecordsWithEnvelope,
  writeAndVerifyActionCenterRecordsWithEnvelope,
} from "./builders"
import { resetOperationEnvelopeHistory } from "./history-store"
import { readOperationHistoryPage } from "./read-operation-history-page"
import { resetOperationEnvelopeStoreCache } from "./store/get-store"

describe("readOperationHistoryPage", () => {
  beforeEach(async () => {
    delete process.env.CLINIQ_ENABLE_REAL_PERSISTENCE
    resetPersistenceAdapterCache()
    resetAuditLog()
    resetMetrics()
    resetOperationEnvelopeStoreCache()
    await resetOperationEnvelopeHistory()
  })

  afterEach(async () => {
    resetPersistenceAdapterCache()
    resetSupabaseClientCache()
    resetAuditLog()
    resetMetrics()
    resetOperationEnvelopeStoreCache()
    await resetOperationEnvelopeHistory()
  })

  it("reads paged operation history", async () => {
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

    await writeAndVerifyActionCenterRecordsWithEnvelope({
      records: [
        {
          id: "raw-2",
          type: "action_item",
          payload: { id: "B" },
          createdAt: "2026-04-05T00:00:02.000Z",
        },
      ],
      mode: "full",
      timestamp: "2026-04-05T00:00:02.000Z",
    })

    const first = await readOperationHistoryPage({ limit: 2 })

    expect(first.records.map((r) => r.kind)).toEqual(["write", "verify"])
    expect(typeof first.nextCursor).toBe("string")

    const second = await readOperationHistoryPage({
      limit: 2,
      cursor: first.nextCursor || undefined,
    })

    expect(second.records.map((r) => r.kind)).toEqual(["write_and_verify"])
    expect(second.nextCursor).toBeNull()
  })

  it("preserves filters while paging", async () => {
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
      expectedIds: ["missing"],
      mode: "full",
      timestamp: "2026-04-05T00:00:01.000Z",
    })

    await verifyActionCenterRecordsWithEnvelope({
      expectedIds: ["still-missing"],
      mode: "full",
      timestamp: "2026-04-05T00:00:02.000Z",
    })

    const page = await readOperationHistoryPage({
      kind: "verify",
      status: "verification_failed",
      limit: 1,
    })

    expect(page.records.length).toBe(1)
    expect(page.records[0]!.kind).toBe("verify")
    expect(page.records[0]!.status).toBe("verification_failed")
    expect(typeof page.nextCursor).toBe("string")
  })
})
