import { beforeEach, describe, expect, it } from "vitest"

import { getMockServerActionCenterState, resetMockServerActionCenterState } from "./mock-server-state"
import { mutateActionCenter } from "./mutate-action-center"
import type { ActionCenterMutationRequest } from "./mutation-api-types"
import type { ActionCenterRowAction } from "./row-actions"

describe("mutateActionCenter", () => {
  beforeEach(() => {
    resetMockServerActionCenterState()
  })

  function firstOpenItemId(): string {
    const state = getMockServerActionCenterState()
    const item = state.items.find((i) => i.status !== "resolved")
    expect(item).toBeDefined()
    return item!.id
  }

  it("valid mark_in_progress returns ok true", () => {
    const itemId = firstOpenItemId()
    const out = mutateActionCenter({ itemId, action: "mark_in_progress" })

    expect(out.ok).toBe(true)
    if (out.ok) {
      expect(out.data.itemId).toBe(itemId)
      expect(out.data.action).toBe("mark_in_progress")
      expect(out.data.result.items.find((i) => i.id === itemId)?.status).toBe("in_progress")
    }
  })

  it("valid mark_resolved returns ok true", () => {
    const itemId = firstOpenItemId()
    const out = mutateActionCenter({ itemId, action: "mark_resolved" })

    expect(out.ok).toBe(true)
    if (out.ok) {
      expect(out.data.itemId).toBe(itemId)
      expect(out.data.action).toBe("mark_resolved")
      expect(out.data.result.items.find((i) => i.id === itemId)?.status).toBe("resolved")
    }
  })

  it("invalid request returns invalid_request (missing itemId)", () => {
    const out = mutateActionCenter({} as ActionCenterMutationRequest)
    expect(out).toEqual({ ok: false, error: "invalid_request" })
  })

  it("invalid request returns invalid_request (blank itemId)", () => {
    expect(mutateActionCenter({ itemId: "   ", action: "mark_in_progress" })).toEqual({
      ok: false,
      error: "invalid_request",
    })
  })

  it("invalid request returns invalid_request (blank action)", () => {
    expect(
      mutateActionCenter({
        itemId: firstOpenItemId(),
        action: "  " as ActionCenterRowAction,
      }),
    ).toEqual({
      ok: false,
      error: "invalid_request",
    })
  })

  it("unsupported action returns unsupported_action", () => {
    const itemId = firstOpenItemId()
    const out = mutateActionCenter({ itemId, action: "view_details" })
    expect(out).toEqual({ ok: false, error: "unsupported_action" })
  })

  it("unknown item returns item_not_found", () => {
    const out = mutateActionCenter({
      itemId: "definitely-not-a-real-action-center-item",
      action: "mark_in_progress",
    })
    expect(out).toEqual({ ok: false, error: "item_not_found" })
  })

  it("successful mutation updates mock server state", () => {
    const itemId = firstOpenItemId()
    const before = getMockServerActionCenterState()
    expect(before.items.find((i) => i.id === itemId)?.status).toBe("open")

    const out = mutateActionCenter({ itemId, action: "mark_in_progress" })
    expect(out.ok).toBe(true)

    const after = getMockServerActionCenterState()
    expect(after.items.find((i) => i.id === itemId)?.status).toBe("in_progress")
    if (out.ok) {
      expect(after).toBe(out.data.result)
    }
  })

  it("repeated mutation is deterministic", () => {
    const itemId = firstOpenItemId()

    mutateActionCenter({ itemId, action: "mark_in_progress" })
    const snapshotA = JSON.parse(JSON.stringify(getMockServerActionCenterState()))

    resetMockServerActionCenterState()
    mutateActionCenter({ itemId, action: "mark_in_progress" })
    const snapshotB = JSON.parse(JSON.stringify(getMockServerActionCenterState()))

    expect(snapshotB).toEqual(snapshotA)
  })

  it("summary updates after resolve", () => {
    const itemId = firstOpenItemId()
    const before = getMockServerActionCenterState()
    const summaryBefore = before.summary
    const resolvedItem = before.items.find((i) => i.id === itemId)
    expect(resolvedItem?.status).toBe("open")

    const out = mutateActionCenter({ itemId, action: "mark_resolved" })
    expect(out.ok).toBe(true)

    const after = getMockServerActionCenterState()
    expect(after.summary.totalOpen).toBe(summaryBefore.totalOpen - 1)

    const sumMissingNonResolved = after.items
      .filter((i) => i.status !== "resolved")
      .reduce((s, i) => s + i.missingAmount, 0)
    expect(after.summary.totalMissingAmount).toBe(sumMissingNonResolved)
  })
})
