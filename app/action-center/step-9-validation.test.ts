/**
 * STEP 9 — Action Center validation (no RTL in repo).
 *
 * Automated: mock queue + detail view + local mutations + summary recompute (same logic as the page).
 *
 * Manual: loading spinner then queue; click row → drawer; Mark in progress / Mark resolved update row,
 * drawer, and summary cards; resolved rows stay visible and faded; refresh restores mock from GET
 * /api/action-center (no persistence).
 */

import { describe, expect, it, vi } from "vitest"

import {
  applyRowActionToActionCenterResult,
  buildActionCenterDetailView,
  getActionCenter,
  getRowActions,
  recomputeActionCenterSummary,
} from "@/lib/cliniq-core/action-center"
import { handleRowAction } from "@/lib/cliniq-ui/action-center/handle-row-action"

describe("STEP 9 — detail drawer data contract (mock queue)", () => {
  it("getActionCenter success items: detail facts match each item", () => {
    const r = getActionCenter()
    expect(r.ok).toBe(true)
    if (!r.ok) return

    for (const item of r.data.items) {
      const { facts } = buildActionCenterDetailView(item)
      expect(facts.studyId).toBe(item.studyId)
      expect(facts.subjectId).toBe(item.subjectId)
      expect(facts.visitName).toBe(item.visitName)
      expect(facts.lineCode).toBe(item.lineCode)
      expect(facts.expectedAmount).toBe(item.expectedAmount)
      expect(facts.invoicedAmount).toBe(item.invoicedAmount)
      expect(facts.missingAmount).toBe(item.missingAmount)
      expect(facts.status).toBe(item.status)
      expect(facts.leakageStatus).toBe(item.leakageStatus)
      expect(facts.leakageReason).toBe(item.leakageReason)
    }
  })

  it("row action list matches getRowActions per item (deterministic keys + enabled flags)", () => {
    const r = getActionCenter()
    expect(r.ok).toBe(true)
    if (!r.ok) return

    for (const item of r.data.items) {
      const detail = buildActionCenterDetailView(item)
      const expected = getRowActions({ status: item.status, actionType: item.actionType })
      expect(detail.rowActions.map((a) => a.key)).toEqual(expected.map((a) => a.key))
      expect(detail.rowActions.map((a) => a.enabled)).toEqual(expected.map((a) => a.enabled))
    }
  })

  it("all mock queue items are open: same row-action key order across items", () => {
    const r = getActionCenter()
    expect(r.ok).toBe(true)
    if (!r.ok) return

    const keyLists = r.data.items.map((item) =>
      buildActionCenterDetailView(item).rowActions.map((a) => a.key),
    )
    const first = keyLists[0]
    for (const keys of keyLists) {
      expect(keys).toEqual(first)
    }
  })

  it("resolved item disables mutation-style row actions", () => {
    const r = getActionCenter()
    expect(r.ok).toBe(true)
    if (!r.ok) return

    const base = r.data.items[0]
    const resolvedItem = { ...base, status: "resolved" as const }
    const detail = buildActionCenterDetailView(resolvedItem)
    const byKey = Object.fromEntries(detail.rowActions.map((a) => [a.key, a]))

    expect(byKey.mark_in_progress?.enabled).toBe(false)
    expect(byKey.mark_resolved?.enabled).toBe(false)
    expect(byKey.assign_owner?.enabled).toBe(false)
    expect(byKey.escalate?.enabled).toBe(false)
    expect(byKey.view_details?.enabled).toBe(true)
  })
})

describe("STEP 9 — handleRowAction", () => {
  it("logs and does not throw (no fetch)", () => {
    const r = getActionCenter()
    expect(r.ok).toBe(true)
    if (!r.ok) return

    const item = r.data.items[0]
    const spy = vi.spyOn(console, "log").mockImplementation(() => {})

    expect(() => handleRowAction({ action: "view_details", item })).not.toThrow()
    expect(spy).toHaveBeenCalledWith("Action Center row action", { action: "view_details", item })

    spy.mockRestore()
  })
})

describe("STEP 9 — local mutation + summary (mirrors page state)", () => {
  it("mark_in_progress updates item status; summary stays in sync with recompute; totalOpen unchanged", () => {
    const r = getActionCenter()
    expect(r.ok).toBe(true)
    if (!r.ok) return

    const target = r.data.items[0]
    const beforeOpen = r.data.summary.totalOpen

    const next = applyRowActionToActionCenterResult({
      result: r.data,
      itemId: target.id,
      action: "mark_in_progress",
    })

    expect(next.items.find((i) => i.id === target.id)?.status).toBe("in_progress")
    expect(next.summary).toEqual(recomputeActionCenterSummary(next.items))
    expect(next.summary.totalOpen).toBe(beforeOpen)
  })

  it("mark_resolved keeps same item count; item status resolved; summary excludes from open, missing, and high", () => {
    const r = getActionCenter()
    expect(r.ok).toBe(true)
    if (!r.ok) return

    const target =
      r.data.items.find((i) => i.priority === "high") ?? r.data.items[0]
    const beforeOpen = r.data.summary.totalOpen
    const beforeMissing = r.data.summary.totalMissingAmount
    const beforeHigh = r.data.summary.totalHighPriority
    const targetMissing = target.missingAmount
    const wasHigh = target.priority === "high"

    const next = applyRowActionToActionCenterResult({
      result: r.data,
      itemId: target.id,
      action: "mark_resolved",
    })

    expect(next.items).toHaveLength(r.data.items.length)
    expect(next.items.some((i) => i.id === target.id && i.status === "resolved")).toBe(true)
    expect(next.summary).toEqual(recomputeActionCenterSummary(next.items))
    expect(next.summary.totalOpen).toBe(beforeOpen - 1)
    expect(next.summary.totalMissingAmount).toBe(beforeMissing - targetMissing)
    if (wasHigh) {
      expect(next.summary.totalHighPriority).toBe(beforeHigh - 1)
    }
  })

  it("non-mutating applyRowActionToActionCenterResult leaves items + summary unchanged", () => {
    const r = getActionCenter()
    expect(r.ok).toBe(true)
    if (!r.ok) return

    const id = r.data.items[0].id
    const next = applyRowActionToActionCenterResult({
      result: r.data,
      itemId: id,
      action: "view_details",
    })

    expect(next.items).toBe(r.data.items)
    expect(next.summary).toEqual(r.data.summary)
  })

  it("drawer detail view reflects status after mark_in_progress (derived item shape)", () => {
    const r = getActionCenter()
    expect(r.ok).toBe(true)
    if (!r.ok) return

    const id = r.data.items[0].id
    const updated = applyRowActionToActionCenterResult({
      result: r.data,
      itemId: id,
      action: "mark_in_progress",
    })
    const item = updated.items.find((i) => i.id === id)
    expect(item).toBeDefined()
    if (!item) return
    const detail = buildActionCenterDetailView(item)
    expect(detail.facts.status).toBe("in_progress")
    expect(getRowActions({ status: "in_progress", actionType: item.actionType }).map((a) => a.enabled)).toEqual(
      detail.rowActions.map((a) => a.enabled),
    )
  })
})
