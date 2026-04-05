import { beforeEach, describe, expect, it } from "vitest"

import {
  appendOperationEnvelope,
  listOperationEnvelopes,
  resetOperationEnvelopeHistory,
} from "./history-store"
import { resetOperationEnvelopeStoreCache } from "./store/get-store"

describe("operation envelope history store", () => {
  beforeEach(async () => {
    resetOperationEnvelopeStoreCache()
    await resetOperationEnvelopeHistory()
  })

  it("stores and lists envelopes in deterministic order", async () => {
    await appendOperationEnvelope({
      operationId: "verify::2026-04-05T00:00:01.000Z",
      timestamp: "2026-04-05T00:00:01.000Z",
      kind: "verify",
      status: "success",
      summary: {
        status: "success",
        totalExpected: 1,
        found: 1,
        missing: [],
        matched: ["a"],
        warnings: [],
        mode: "full",
      },
    })

    await appendOperationEnvelope({
      operationId: "write::2026-04-05T00:00:00.000Z",
      timestamp: "2026-04-05T00:00:00.000Z",
      kind: "write",
      status: "success",
      summary: {
        status: "success",
        ok: true,
        partial: false,
        attempted: 1,
        written: 1,
      },
    })

    const rows = await listOperationEnvelopes()

    expect(rows.map((x) => x.operationId)).toEqual([
      "write::2026-04-05T00:00:00.000Z",
      "verify::2026-04-05T00:00:01.000Z",
    ])
  })
})
