import { beforeEach, describe, expect, it } from "vitest"

import { resetMemoryActionCenterBootstrap } from "@/lib/cliniq-core/action-center/bootstrap-memory-action-center"
import { getActionCenter } from "@/lib/cliniq-core/action-center/get-action-center"
import { resetMemoryPersistenceAdapterState } from "@/lib/cliniq-core/action-center/memory-persistence-adapter"
import { resetMockServerActionCenterState } from "@/lib/cliniq-core/action-center/mock-server-state"

import { POST } from "./route"

function firstFixtureItemId(): string {
  const r = getActionCenter()
  expect(r.ok).toBe(true)
  if (!r.ok) throw new Error("fixture_unavailable")
  return r.data.items[0]!.id
}

function postJson(body: unknown) {
  return POST(
    new Request("http://localhost/api/action-center/mutate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  )
}

describe("POST /api/action-center/mutate", () => {
  beforeEach(() => {
    resetMockServerActionCenterState()
    resetMemoryPersistenceAdapterState()
    resetMemoryActionCenterBootstrap()
  })

  it("returns 200 for mark_in_progress", async () => {
    const itemId = firstFixtureItemId()
    const res = await postJson({ itemId, action: "mark_in_progress" })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    if (json.ok) {
      expect(json.data.itemId).toBe(itemId)
      expect(json.data.action).toBe("mark_in_progress")
      expect(json.data.result.items.find((i: { id: string }) => i.id === itemId)?.status).toBe(
        "in_progress",
      )
    }
  })

  it("returns 200 for mark_resolved", async () => {
    const itemId = firstFixtureItemId()
    const res = await postJson({ itemId, action: "mark_resolved" })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    if (json.ok) {
      expect(json.data.action).toBe("mark_resolved")
      expect(json.data.result.items.find((i: { id: string }) => i.id === itemId)?.status).toBe("resolved")
    }
  })

  it("returns 400 with unsupported_action for unsupported actions", async () => {
    const itemId = firstFixtureItemId()
    const res = await postJson({ itemId, action: "view_details" })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ ok: false, error: "unsupported_action" })
  })

  it("returns 400 for invalid request", async () => {
    const res = await postJson({})
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ ok: false, error: "invalid_request" })
  })

  it("returns 404 for unknown item", async () => {
    const res = await postJson({
      itemId: "unknown-action-center-item-id",
      action: "mark_resolved",
    })
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ ok: false, error: "item_not_found" })
  })

  it("returns stable response shape", async () => {
    const itemId = firstFixtureItemId()
    const okRes = await postJson({ itemId, action: "mark_resolved" })
    expect(okRes.status).toBe(200)
    const okJson = (await okRes.json()) as Record<string, unknown>

    expect(Object.keys(okJson).sort()).toEqual(["data", "ok"])
    expect(okJson.ok).toBe(true)
    const data = okJson.data as Record<string, unknown>
    expect(Object.keys(data).sort()).toEqual(["action", "itemId", "result"])
    expect(data.itemId).toBe(itemId)
    expect(data.action).toBe("mark_resolved")

    const result = data.result as Record<string, unknown>
    expect(Object.keys(result).sort()).toEqual(["items", "summary"])
    expect(Array.isArray(result.items)).toBe(true)
    const summary = result.summary as Record<string, unknown>
    expect(Object.keys(summary).sort()).toEqual([
      "byActionType",
      "byOwnerRole",
      "totalHighPriority",
      "totalMissingAmount",
      "totalOpen",
    ])

    const errRes = await postJson({ itemId: "x", action: "view_details" })
    expect(errRes.status).toBe(400)
    const errJson = (await errRes.json()) as Record<string, unknown>
    expect(Object.keys(errJson).sort()).toEqual(["error", "ok"])
    expect(errJson.ok).toBe(false)
    expect(typeof errJson.error).toBe("string")
  })
})
