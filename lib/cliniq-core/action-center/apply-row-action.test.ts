import { describe, expect, it } from "vitest"

import { applyRowActionToActionCenterResult } from "./apply-row-action-to-result"
import { applyRowAction } from "./apply-row-action"
import { recomputeActionCenterSummary } from "./recompute-summary"
import type { ActionCenterRowAction } from "./row-actions"
import type { ActionCenterItem, ActionCenterResult } from "./types"

function makeItem(overrides: Partial<ActionCenterItem> = {}): ActionCenterItem {
  return {
    id: "a",
    studyId: "S",
    subjectId: "SUB",
    visitName: "V1",
    lineCode: "L",
    actionType: "prepare_invoice",
    ownerRole: "billing",
    priority: "medium",
    status: "open",
    title: "T",
    description: "D",
    expectedAmount: 1,
    invoicedAmount: 0,
    missingAmount: 1,
    leakageStatus: "missing",
    leakageReason: "not_invoiced",
    ...overrides,
  }
}

describe("applyRowAction", () => {
  it("mark_in_progress: open → in_progress; matching item changes; others unchanged", () => {
    const i0 = makeItem({ id: "0", status: "open" })
    const i1 = makeItem({ id: "1", status: "open" })
    const items = [i0, i1]
    const r = applyRowAction({ items, itemId: "1", action: "mark_in_progress" })

    expect(r.items).not.toBe(items)
    expect(r.items[0]).toBe(i0)
    expect(r.items[0].status).toBe("open")
    expect(r.items[1]).not.toBe(i1)
    expect(r.items[1].status).toBe("in_progress")
  })

  it("mark_in_progress does not change resolved; resolved stays resolved", () => {
    const resolved = makeItem({ id: "y", status: "resolved", missingAmount: 99 })
    const items = [resolved]
    const r = applyRowAction({ items, itemId: "y", action: "mark_in_progress" })

    expect(r.items).toBe(items)
    expect(r.items[0].status).toBe("resolved")
    expect(r.items[0]).toBe(resolved)
  })

  it("mark_resolved: open → resolved with correct status", () => {
    const items = [makeItem({ id: "z", status: "open" })]
    const r = applyRowAction({ items, itemId: "z", action: "mark_resolved" })
    expect(r.items[0].status).toBe("resolved")
    expect(r.items[0]).not.toBe(items[0])
  })

  it("mark_resolved: in_progress → resolved with correct status", () => {
    const items = [makeItem({ id: "z", status: "in_progress" })]
    const r = applyRowAction({ items, itemId: "z", action: "mark_resolved" })
    expect(r.items[0].status).toBe("resolved")
  })

  it("mark_resolved: blocked → resolved", () => {
    const items = [makeItem({ id: "z", status: "blocked" })]
    const r = applyRowAction({ items, itemId: "z", action: "mark_resolved" })
    expect(r.items[0].status).toBe("resolved")
  })

  it("mark_resolved: already resolved → same items reference", () => {
    const items = [makeItem({ id: "z", status: "resolved" })]
    expect(applyRowAction({ items, itemId: "z", action: "mark_resolved" }).items).toBe(items)
  })

  it("mark_in_progress: in_progress unchanged (no transition)", () => {
    const items = [makeItem({ id: "x", status: "in_progress" })]
    expect(applyRowAction({ items, itemId: "x", action: "mark_in_progress" }).items).toBe(items)
  })

  const nonMutating: ActionCenterRowAction[] = [
    "view_details",
    "assign_owner",
    "escalate",
    "open_related_claim",
    "open_related_invoice",
    "open_related_subject",
  ]

  it.each(nonMutating)("non-mutating action %s does not change items reference", (action) => {
    const items = [makeItem({ id: "1" })]
    const r = applyRowAction({ items, itemId: "1", action })
    expect(r.items).toBe(items)
  })

  it("unknown itemId → same items reference", () => {
    const items = [makeItem({ id: "1" })]
    expect(applyRowAction({ items, itemId: "nope", action: "mark_resolved" }).items).toBe(items)
  })

  it("immutability: original input array and untouched item objects unchanged after mark_in_progress", () => {
    const i0 = makeItem({ id: "0", status: "open" })
    const i1 = makeItem({ id: "1", status: "open" })
    const items = [i0, i1]
    const before1 = { ...i1 }

    applyRowAction({ items, itemId: "1", action: "mark_in_progress" })

    expect(items).toHaveLength(2)
    expect(items[0]).toBe(i0)
    expect(items[1]).toBe(i1)
    expect(items[1].status).toBe(before1.status)
  })

  it("immutability: original item object unchanged after mark_resolved", () => {
    const i0 = makeItem({ id: "0", status: "open", missingAmount: 42 })
    const items = [i0]
    applyRowAction({ items, itemId: "0", action: "mark_resolved" })
    expect(items[0]).toBe(i0)
    expect(items[0].status).toBe("open")
    expect(items[0].missingAmount).toBe(42)
  })

  it("ordering preserved: item ids stay in same order after mark_resolved", () => {
    const items = [
      makeItem({ id: "first", status: "open" }),
      makeItem({ id: "second", status: "open", lineCode: "B" }),
      makeItem({ id: "third", status: "open", lineCode: "C" }),
    ]
    const r = applyRowAction({ items, itemId: "second", action: "mark_resolved" })
    expect(r.items.map((i) => i.id)).toEqual(["first", "second", "third"])
    expect(r.items[1].status).toBe("resolved")
  })

  it("ordering preserved after mark_in_progress", () => {
    const items = [
      makeItem({ id: "a", status: "open" }),
      makeItem({ id: "b", status: "open", lineCode: "B" }),
    ]
    const r = applyRowAction({ items, itemId: "b", action: "mark_in_progress" })
    expect(r.items.map((i) => i.id)).toEqual(["a", "b"])
  })
})

describe("recomputeActionCenterSummary (resolved exclusion)", () => {
  it("resolved item still in list; totalOpen and totalMissingAmount exclude it", () => {
    const open = makeItem({ id: "o", status: "open", missingAmount: 10 })
    const resolved = makeItem({ id: "r", status: "resolved", missingAmount: 1000 })
    const items = [open, resolved]

    const s = recomputeActionCenterSummary(items)

    expect(items).toHaveLength(2)
    expect(items.some((i) => i.id === "r" && i.status === "resolved")).toBe(true)
    expect(s.totalOpen).toBe(1)
    expect(s.totalMissingAmount).toBe(10)
  })
})

describe("applyRowActionToActionCenterResult", () => {
  it("recomputes summary: one resolved item reduces totalOpen and totalMissingAmount", () => {
    const a = makeItem({ id: "a", status: "open", missingAmount: 50, ownerRole: "billing", actionType: "prepare_invoice" })
    const b = makeItem({
      id: "b",
      status: "open",
      missingAmount: 30,
      lineCode: "X",
      ownerRole: "finance",
      actionType: "resolve_claim_issue",
    })
    const result: ActionCenterResult = {
      items: [a, b],
      summary: recomputeActionCenterSummary([a, b]),
    }

    expect(result.summary.totalOpen).toBe(2)
    expect(result.summary.totalMissingAmount).toBe(80)

    const next = applyRowActionToActionCenterResult({
      result,
      itemId: "a",
      action: "mark_resolved",
    })

    expect(next.items.find((i) => i.id === "a")?.status).toBe("resolved")
    expect(next.summary.totalOpen).toBe(1)
    expect(next.summary.totalMissingAmount).toBe(30)
    expect(next.items.map((i) => i.id)).toEqual(["a", "b"])
  })

  it("does not mutate original ActionCenterResult", () => {
    const r0 = makeItem({ id: "0", status: "open" })
    const result: ActionCenterResult = {
      items: [r0],
      summary: recomputeActionCenterSummary([r0]),
    }
    const itemsRef = result.items
    applyRowActionToActionCenterResult({
      result,
      itemId: "0",
      action: "mark_resolved",
    })
    expect(result.items).toBe(itemsRef)
    expect(result.items[0].status).toBe("open")
  })
})
