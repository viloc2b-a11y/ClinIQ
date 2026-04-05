import { beforeEach, describe, expect, it } from "vitest"

import { writeActionCenterRecordsWithEnvelope } from "./builders"
import { resetAuditLog } from "../audit-log"
import { resetMetrics } from "../metrics"
import { resetPersistenceAdapterCache } from "../persistence/get-adapter"
import { resetOperationEnvelopeHistory } from "./history-store"
import { readOperationHistory } from "./read-operation-history"
import { resetOperationEnvelopeStoreCache } from "./store/get-store"

describe("readOperationHistory", () => {
  beforeEach(async () => {
    delete process.env.CLINIQ_ENABLE_REAL_PERSISTENCE
    resetPersistenceAdapterCache()
    resetAuditLog()
    resetMetrics()
    resetOperationEnvelopeStoreCache()
    await resetOperationEnvelopeHistory()
  })

  it("returns all envelopes matching non-paged read input", async () => {
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

    const history = await readOperationHistory()

    expect(history.length).toBe(1)
    expect(history[0]!.kind).toBe("write")
  })
})
