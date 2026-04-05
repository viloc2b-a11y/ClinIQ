import { beforeEach, describe, expect, it } from "vitest"

import { MemoryActionCenterMetricsStore } from "./memory-metrics-store"

describe("MemoryActionCenterMetricsStore", () => {
  beforeEach(async () => {
    await new MemoryActionCenterMetricsStore().reset()
  })

  it("gets, sets, and resets metrics", async () => {
    const store = new MemoryActionCenterMetricsStore()

    expect(await store.get()).toEqual({
      writesAttempted: 0,
      writesSuccess: 0,
      writesFailed: 0,
    })

    await store.set({
      writesAttempted: 3,
      writesSuccess: 2,
      writesFailed: 1,
    })

    expect(await store.get()).toEqual({
      writesAttempted: 3,
      writesSuccess: 2,
      writesFailed: 1,
    })

    await store.reset()

    expect(await store.get()).toEqual({
      writesAttempted: 0,
      writesSuccess: 0,
      writesFailed: 0,
    })
  })
})
