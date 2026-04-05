import { beforeEach, describe, expect, it } from "vitest"

import { resetMemoryActionCenterBootstrap } from "@/lib/cliniq-core/action-center/bootstrap-memory-action-center"
import { resetMemoryPersistenceAdapterState } from "@/lib/cliniq-core/action-center/memory-persistence-adapter"
import { resetMockServerActionCenterState } from "@/lib/cliniq-core/action-center/mock-server-state"

import { GET } from "./route"

describe("GET /api/action-center", () => {
  beforeEach(() => {
    resetMockServerActionCenterState()
    resetMemoryPersistenceAdapterState()
    resetMemoryActionCenterBootstrap()
  })

  it("returns 200 with ok true and stable payload shape", async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const json = (await res.json()) as Record<string, unknown>

    expect(Object.keys(json).sort()).toEqual(["data", "ok"])
    expect(json.ok).toBe(true)
    const data = json.data as Record<string, unknown>
    expect(Object.keys(data).sort()).toEqual(["items", "summary"])
    expect(Array.isArray(data.items)).toBe(true)
    expect((data.items as unknown[]).length).toBeGreaterThan(0)

    const summary = data.summary as Record<string, unknown>
    expect(Object.keys(summary).sort()).toEqual([
      "byActionType",
      "byOwnerRole",
      "totalHighPriority",
      "totalMissingAmount",
      "totalOpen",
    ])
  })
})
