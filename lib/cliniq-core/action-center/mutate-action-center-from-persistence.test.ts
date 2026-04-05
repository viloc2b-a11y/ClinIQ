import { beforeEach, describe, expect, it, vi } from "vitest"

import { mutateActionCenterFromPersistence } from "./mutate-action-center-from-persistence"
import { recomputeActionCenterSummary } from "./recompute-summary"
import type { ActionCenterItem } from "./types"
import {
  getActionCenterPersistenceAdapter,
  resetActionCenterPersistenceAdapterCache,
} from "./get-persistence-adapter"
import { resetMemoryPersistenceAdapterState } from "./memory-persistence-adapter"

vi.mock("./get-persistence-adapter", async (importOriginal) => {
  const mod = await importOriginal<typeof import("./get-persistence-adapter")>()
  return {
    ...mod,
    getActionCenterPersistenceAdapter: vi.fn(),
  }
})

const mockedGetAdapter = vi.mocked(getActionCenterPersistenceAdapter)

function makeItem(overrides: Partial<ActionCenterItem> = {}): ActionCenterItem {
  return {
    id: "row-1",
    studyId: "S",
    subjectId: "SUB",
    visitName: "V",
    lineCode: "L",
    actionType: "prepare_invoice",
    ownerRole: "billing",
    priority: "medium",
    status: "open",
    title: "T",
    description: "D",
    expectedAmount: 10,
    invoicedAmount: 0,
    missingAmount: 10,
    leakageStatus: "missing",
    leakageReason: "not_invoiced",
    ...overrides,
  }
}

function setupAdapterSequence(states: ActionCenterItem[][]) {
  const listActionItems = vi.fn()
  states.forEach((s) => {
    listActionItems.mockResolvedValueOnce(s)
  })
  const updateActionItemStatus = vi.fn().mockResolvedValue(undefined)
  const appendActionItemEvent = vi.fn().mockResolvedValue(undefined)
  mockedGetAdapter.mockReturnValue({
    listActionItems,
    updateActionItemStatus,
    appendActionItemEvent,
  } as never)
  return { listActionItems, updateActionItemStatus, appendActionItemEvent }
}

describe("mutateActionCenterFromPersistence", () => {
  beforeEach(() => {
    resetMemoryPersistenceAdapterState()
    resetActionCenterPersistenceAdapterCache()
    mockedGetAdapter.mockReset()
  })

  it("invalid request", async () => {
    expect(await mutateActionCenterFromPersistence({} as never)).toEqual({
      ok: false,
      error: "invalid_request",
    })
    expect(await mutateActionCenterFromPersistence({ itemId: "", action: "mark_resolved" })).toEqual({
      ok: false,
      error: "invalid_request",
    })
    expect(
      await mutateActionCenterFromPersistence({ itemId: "x", action: "  " }),
    ).toEqual({
      ok: false,
      error: "invalid_request",
    })
  })

  it("unsupported action", async () => {
    const out = await mutateActionCenterFromPersistence({ itemId: "x", action: "view_details" })
    expect(out).toEqual({ ok: false, error: "unsupported_action" })
    expect(mockedGetAdapter).not.toHaveBeenCalled()
  })

  it("item not found", async () => {
    setupAdapterSequence([[]])
    const out = await mutateActionCenterFromPersistence({
      itemId: "missing",
      action: "mark_resolved",
    })
    expect(out).toEqual({ ok: false, error: "item_not_found" })
  })

  it("mark_in_progress updates status through adapter", async () => {
    const open = makeItem({ id: "x", status: "open" })
    const after = [makeItem({ id: "x", status: "in_progress" })]
    const { listActionItems, updateActionItemStatus } = setupAdapterSequence([[open], after])

    const out = await mutateActionCenterFromPersistence({
      itemId: "x",
      action: "mark_in_progress",
    })

    expect(out.ok).toBe(true)
    expect(updateActionItemStatus).toHaveBeenCalledWith({
      itemId: "x",
      status: "in_progress",
    })
    expect(listActionItems).toHaveBeenCalledTimes(2)
    if (out.ok) {
      expect(out.data.result.items).toEqual(after)
    }
  })

  it("mark_resolved updates status through adapter", async () => {
    const open = makeItem({ id: "x", status: "open" })
    const after = [makeItem({ id: "x", status: "resolved" })]
    const { updateActionItemStatus } = setupAdapterSequence([[open], after])

    const out = await mutateActionCenterFromPersistence({ itemId: "x", action: "mark_resolved" })

    expect(out.ok).toBe(true)
    expect(updateActionItemStatus).toHaveBeenCalledWith({
      itemId: "x",
      status: "resolved",
    })
    if (out.ok) {
      expect(out.data.result.items[0]?.status).toBe("resolved")
    }
  })

  it("appendActionItemEvent is called on real transition", async () => {
    const open = makeItem({ id: "x", status: "open" })
    const after = [makeItem({ id: "x", status: "in_progress" })]
    const { appendActionItemEvent } = setupAdapterSequence([[open], after])

    await mutateActionCenterFromPersistence({ itemId: "x", action: "mark_in_progress" })

    expect(appendActionItemEvent).toHaveBeenCalledTimes(1)
    expect(appendActionItemEvent).toHaveBeenCalledWith({
      actionItemId: "x",
      eventType: "mark_in_progress",
      fromStatus: "open",
      toStatus: "in_progress",
      actorType: "system",
      payload: {},
    })
  })

  it("summary recomputed from latest adapter state", async () => {
    const open = makeItem({ id: "x", status: "open" })
    const after = [makeItem({ id: "x", status: "resolved", missingAmount: 999 })]
    setupAdapterSequence([[open], after])

    const out = await mutateActionCenterFromPersistence({ itemId: "x", action: "mark_resolved" })

    expect(out.ok).toBe(true)
    if (out.ok) {
      expect(out.data.result.summary).toEqual(recomputeActionCenterSummary(after))
    }
  })

  it("repeated no-op mutation remains deterministic", async () => {
    const resolved = makeItem({ id: "x", status: "resolved" })
    const listActionItems = vi.fn().mockResolvedValue([resolved])
    const updateActionItemStatus = vi.fn().mockResolvedValue(undefined)
    const appendActionItemEvent = vi.fn().mockResolvedValue(undefined)
    mockedGetAdapter.mockReturnValue({
      listActionItems,
      updateActionItemStatus,
      appendActionItemEvent,
    } as never)

    const first = await mutateActionCenterFromPersistence({ itemId: "x", action: "mark_resolved" })
    const second = await mutateActionCenterFromPersistence({ itemId: "x", action: "mark_resolved" })

    expect(first).toEqual(second)
    expect(updateActionItemStatus).not.toHaveBeenCalled()
    expect(appendActionItemEvent).not.toHaveBeenCalled()
    expect(listActionItems).toHaveBeenCalledTimes(4)
    if (first.ok && second.ok) {
      expect(first.data.result.summary).toEqual(second.data.result.summary)
    }
  })

  it("returns failed_to_apply_action when adapter throws", async () => {
    mockedGetAdapter.mockReturnValue({
      listActionItems: vi.fn().mockRejectedValue(new Error("boom")),
    } as never)

    const out = await mutateActionCenterFromPersistence({
      itemId: "x",
      action: "mark_resolved",
    })
    expect(out).toEqual({ ok: false, error: "failed_to_apply_action" })
  })
})
