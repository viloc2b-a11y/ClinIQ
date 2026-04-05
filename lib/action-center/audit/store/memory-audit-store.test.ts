import { beforeEach, describe, expect, it } from "vitest"

import { MemoryActionCenterAuditStore } from "./memory-audit-store"

describe("MemoryActionCenterAuditStore", () => {
  beforeEach(async () => {
    await new MemoryActionCenterAuditStore().reset()
  })

  it("appends, lists, filters, and resets", async () => {
    const store = new MemoryActionCenterAuditStore()

    await store.append({
      id: "a",
      step: "write_success",
      timestamp: "2026-04-05T00:00:01.000Z",
    })

    await store.append({
      id: "a",
      step: "write_attempt",
      timestamp: "2026-04-05T00:00:00.000Z",
    })

    await store.append({
      id: "b",
      step: "write_fail",
      timestamp: "2026-04-05T00:00:02.000Z",
    })

    const all = await store.list()
    expect(all).toEqual([
      {
        id: "a",
        step: "write_attempt",
        timestamp: "2026-04-05T00:00:00.000Z",
      },
      {
        id: "a",
        step: "write_success",
        timestamp: "2026-04-05T00:00:01.000Z",
      },
      {
        id: "b",
        step: "write_fail",
        timestamp: "2026-04-05T00:00:02.000Z",
      },
    ])

    const filtered = await store.list({
      id: "a",
      step: "write_success",
    })

    expect(filtered).toEqual([
      {
        id: "a",
        step: "write_success",
        timestamp: "2026-04-05T00:00:01.000Z",
      },
    ])

    await store.reset()
    expect(await store.list()).toEqual([])
  })

  it("supports paged reads", async () => {
    const store = new MemoryActionCenterAuditStore()

    await store.append({
      id: "a",
      step: "write_attempt",
      timestamp: "2026-04-05T00:00:00.000Z",
    })

    await store.append({
      id: "a",
      step: "write_success",
      timestamp: "2026-04-05T00:00:01.000Z",
    })

    const first = await store.readPage?.({ limit: 1 })

    expect(first?.records).toEqual([
      {
        id: "a",
        step: "write_attempt",
        timestamp: "2026-04-05T00:00:00.000Z",
      },
    ])
    expect(typeof first?.nextCursor).toBe("string")

    const second = await store.readPage?.({
      limit: 1,
      cursor: first?.nextCursor || undefined,
    })

    expect(second?.records).toEqual([
      {
        id: "a",
        step: "write_success",
        timestamp: "2026-04-05T00:00:01.000Z",
      },
    ])
    expect(second?.nextCursor).toBeNull()
  })
})
