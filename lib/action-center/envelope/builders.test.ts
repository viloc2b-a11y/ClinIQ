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
import { readOperationHistory } from "./read-operation-history"
import { resetOperationEnvelopeStoreCache } from "./store/get-store"

describe("action center envelope builders", () => {
  beforeEach(async () => {
    delete process.env.CLINIQ_ENABLE_REAL_PERSISTENCE
    resetPersistenceAdapterCache()
    await resetAuditLog()
    await resetMetrics()
    resetOperationEnvelopeStoreCache()
    await resetOperationEnvelopeHistory()
  })

  afterEach(async () => {
    resetPersistenceAdapterCache()
    resetSupabaseClientCache()
    await resetAuditLog()
    await resetMetrics()
    resetOperationEnvelopeStoreCache()
    await resetOperationEnvelopeHistory()
  })

  it("wraps write summary in envelope", async () => {
    const result = await writeActionCenterRecordsWithEnvelope({
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

    expect(result.kind).toBe("write")
    expect(result.status).toBe("success")
    expect(result.summary.written).toBe(1)

    const history = await readOperationHistory()
    expect(history.length).toBe(1)
    expect(history[0]!.operationId).toBe(result.operationId)
  })

  it("wraps verify summary in envelope", async () => {
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

    const result = await verifyActionCenterRecordsWithEnvelope({
      expectedIds: ["action_item::A"],
      mode: "full",
      timestamp: "2026-04-05T00:00:01.000Z",
    })

    expect(result.kind).toBe("verify")
    expect(result.status).toBe("success")
    expect(result.summary.matched).toEqual(["action_item::A"])
  })

  it("wraps write_and_verify summary in envelope", async () => {
    const result = await writeAndVerifyActionCenterRecordsWithEnvelope({
      records: [
        {
          id: "raw-1",
          type: "action_item",
          payload: { id: "A" },
          createdAt: "2026-04-05T00:00:00.000Z",
        },
      ],
      mode: "full",
      timestamp: "2026-04-05T00:00:02.000Z",
    })

    expect(result.kind).toBe("write_and_verify")
    expect(result.status).toBe("success")
    expect(result.summary.ok).toBe(true)
  })
})
