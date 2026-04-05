import { beforeEach, describe, expect, it } from "vitest"

import { MemoryOperationEnvelopeStore } from "./memory-operation-envelope-store"

describe("MemoryOperationEnvelopeStore", () => {
  let store: MemoryOperationEnvelopeStore

  beforeEach(async () => {
    store = new MemoryOperationEnvelopeStore()
    await store.reset()
  })

  it("appends, filters, sorts, and resets", async () => {
    await store.append({
      operationId: "verify::2026-04-05T00:00:01.000Z",
      timestamp: "2026-04-05T00:00:01.000Z",
      kind: "verify",
      status: "verification_failed",
      summary: {
        status: "verification_failed",
        totalExpected: 1,
        found: 0,
        missing: ["x"],
        matched: [],
        warnings: ["Some expected action items were not found in Action Center."],
        mode: "full",
      },
    })

    await store.append({
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

    const all = await store.list()
    expect(all.map((x) => x.operationId)).toEqual([
      "write::2026-04-05T00:00:00.000Z",
      "verify::2026-04-05T00:00:01.000Z",
    ])

    const filtered = await store.list({
      kind: "verify",
      status: "verification_failed",
    })
    expect(filtered.map((x) => x.operationId)).toEqual(["verify::2026-04-05T00:00:01.000Z"])

    await store.reset()
    expect(await store.list()).toEqual([])
  })
})
