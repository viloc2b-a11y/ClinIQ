import { describe, expect, it } from "vitest"

import { mergeGeneratedActionItems } from "./merge-generated-action-items"
import type { ActionCenterItem } from "./types"

function item(overrides: Partial<ActionCenterItem> = {}): ActionCenterItem {
  return {
    id: "S::SUB::V1::L1::not_invoiced",
    studyId: "S",
    subjectId: "SUB",
    visitName: "V1",
    lineCode: "L1",
    actionType: "prepare_invoice",
    ownerRole: "billing",
    priority: "medium",
    status: "open",
    title: "Prepare invoice for L1 on V1",
    description: "Desc",
    expectedAmount: 100,
    invoicedAmount: 0,
    missingAmount: 100,
    leakageStatus: "missing",
    leakageReason: "not_invoiced",
    ...overrides,
  }
}

describe("mergeGeneratedActionItems", () => {
  it("inserts new generated item", () => {
    const gen = item({ id: "new-id" })
    const out = mergeGeneratedActionItems({ persistedItems: [], generatedItems: [gen] })
    expect(out.insertedCount).toBe(1)
    expect(out.updatedCount).toBe(0)
    expect(out.unchangedCount).toBe(0)
    expect(out.itemsToUpsert).toEqual([gen])
  })

  it("unchanged item preserves persisted state exactly (no upsert row)", () => {
    const persisted = item({ status: "in_progress", title: "Prepare invoice for L1 on V1" })
    const generated = item({ status: "open", title: "Prepare invoice for L1 on V1" })
    const out = mergeGeneratedActionItems({
      persistedItems: [persisted],
      generatedItems: [generated],
    })
    expect(out.unchangedCount).toBe(1)
    expect(out.insertedCount).toBe(0)
    expect(out.updatedCount).toBe(0)
    expect(out.itemsToUpsert).toEqual([])
  })

  it("changed item preserves persisted status", () => {
    const persisted = item({
      status: "resolved",
      title: "Old title",
      description: "Old desc",
    })
    const generated = item({
      status: "open",
      title: "New title",
      description: "New desc",
      missingAmount: 50,
    })
    const out = mergeGeneratedActionItems({
      persistedItems: [persisted],
      generatedItems: [generated],
    })
    expect(out.updatedCount).toBe(1)
    expect(out.itemsToUpsert).toHaveLength(1)
    expect(out.itemsToUpsert[0]!.status).toBe("resolved")
  })

  it("changed item updates operational fields from generated", () => {
    const persisted = item({ status: "in_progress", title: "Old", description: "Old", missingAmount: 100 })
    const generated = item({
      status: "open",
      title: "New",
      description: "Newer",
      missingAmount: 42,
      priority: "high",
      ownerRole: "coordinator",
      leakageStatus: "partial",
      leakageReason: "partially_invoiced",
      invoicedAmount: 58,
      expectedAmount: 100,
    })
    const out = mergeGeneratedActionItems({
      persistedItems: [persisted],
      generatedItems: [generated],
    })
    const merged = out.itemsToUpsert[0]!
    expect(merged.status).toBe("in_progress")
    expect(merged.title).toBe("New")
    expect(merged.description).toBe("Newer")
    expect(merged.missingAmount).toBe(42)
    expect(merged.priority).toBe("high")
    expect(merged.ownerRole).toBe("coordinator")
    expect(merged.leakageStatus).toBe("partial")
    expect(merged.leakageReason).toBe("partially_invoiced")
    expect(merged.invoicedAmount).toBe(58)
    expect(merged.expectedAmount).toBe(100)
  })

  it("resolved persisted item missing from generated set is not deleted (omitted from itemsToUpsert)", () => {
    const orphan = item({
      id: "orphan-only::resolved",
      status: "resolved",
    })
    const gen = item({ id: "fresh-generated" })
    const out = mergeGeneratedActionItems({
      persistedItems: [orphan],
      generatedItems: [gen],
    })
    expect(out.insertedCount).toBe(1)
    expect(out.itemsToUpsert.map((i) => i.id)).toEqual(["fresh-generated"])
    expect(out.itemsToUpsert.some((i) => i.id === orphan.id)).toBe(false)
  })

  it("deterministic results for same inputs", () => {
    const persisted = [item({ id: "b" }), item({ id: "a", title: "T" })]
    const generated = [item({ id: "c" }), item({ id: "a", title: "Other" })]
    const first = mergeGeneratedActionItems({ persistedItems: persisted, generatedItems: generated })
    const second = mergeGeneratedActionItems({ persistedItems: persisted, generatedItems: generated })
    expect(first).toEqual(second)
    expect(first.itemsToUpsert.map((i) => i.id)).toEqual(["a", "c"])
  })
})
