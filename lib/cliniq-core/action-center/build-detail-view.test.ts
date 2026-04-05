import { describe, expect, it } from "vitest"

import { buildActionCenterDetailView } from "./build-detail-view"
import { getRowActions } from "./row-actions"
import type { ActionCenterItem } from "./types"

function actionCenterItem(overrides: Partial<ActionCenterItem> = {}): ActionCenterItem {
  return {
    id: "ac-test-1",
    studyId: "ST-1",
    sponsorId: "SP-1",
    subjectId: "SUB-1",
    visitName: "Visit 2",
    lineCode: "CBC",
    actionType: "prepare_invoice",
    ownerRole: "billing",
    priority: "high",
    status: "open",
    title: "Test title",
    description: "Test description",
    expectedAmount: 100,
    invoicedAmount: 40,
    missingAmount: 60,
    leakageStatus: "partial",
    leakageReason: "partially_invoiced",
    eventLogId: "evt-1",
    billableInstanceId: "bill-1",
    invoicePeriodStart: "2026-01-01",
    invoicePeriodEnd: "2026-01-31",
    ...overrides,
  }
}

describe("buildActionCenterDetailView", () => {
  it("returns item unchanged inside detail view (same reference)", () => {
    const item = actionCenterItem()
    const detail = buildActionCenterDetailView(item)
    expect(detail.item).toBe(item)
  })

  it("includes row actions from getRowActions", () => {
    const detail = buildActionCenterDetailView(actionCenterItem())
    expect(detail.rowActions.length).toBeGreaterThan(0)
    expect(detail.rowActions.map((a) => a.key)).toEqual(
      getRowActions({ status: "open", actionType: "prepare_invoice" }).map((a) => a.key),
    )
  })

  it("resolved status disables mutation-style actions", () => {
    const detail = buildActionCenterDetailView(actionCenterItem({ status: "resolved" }))
    const byKey = Object.fromEntries(detail.rowActions.map((a) => [a.key, a]))

    expect(byKey.view_details?.enabled).toBe(true)
    expect(byKey.open_related_claim?.enabled).toBe(true)
    expect(byKey.open_related_invoice?.enabled).toBe(true)
    expect(byKey.open_related_subject?.enabled).toBe(true)

    expect(byKey.mark_in_progress?.enabled).toBe(false)
    expect(byKey.mark_resolved?.enabled).toBe(false)
    expect(byKey.assign_owner?.enabled).toBe(false)
    expect(byKey.escalate?.enabled).toBe(false)
  })

  it("facts map correctly from source item", () => {
    const item = actionCenterItem()
    const { facts } = buildActionCenterDetailView(item)

    expect(facts.studyId).toBe(item.studyId)
    expect(facts.sponsorId).toBe(item.sponsorId)
    expect(facts.subjectId).toBe(item.subjectId)
    expect(facts.visitName).toBe(item.visitName)
    expect(facts.lineCode).toBe(item.lineCode)
    expect(facts.expectedAmount).toBe(item.expectedAmount)
    expect(facts.invoicedAmount).toBe(item.invoicedAmount)
    expect(facts.missingAmount).toBe(item.missingAmount)
    expect(facts.ownerRole).toBe(item.ownerRole)
    expect(facts.priority).toBe(item.priority)
    expect(facts.status).toBe(item.status)
    expect(facts.leakageStatus).toBe(item.leakageStatus)
    expect(facts.leakageReason).toBe(item.leakageReason)
    expect(facts.eventLogId).toBe(item.eventLogId)
    expect(facts.billableInstanceId).toBe(item.billableInstanceId)
    expect(facts.invoicePeriodStart).toBe(item.invoicePeriodStart)
    expect(facts.invoicePeriodEnd).toBe(item.invoicePeriodEnd)
  })

  it("deterministic output for same input", () => {
    const item = actionCenterItem()
    const a = buildActionCenterDetailView(item)
    const b = buildActionCenterDetailView(item)
    expect(a).toEqual(b)
    expect(JSON.stringify(a.rowActions)).toBe(JSON.stringify(b.rowActions))
  })
})

describe("getRowActions", () => {
  it("open item enables mark_in_progress and mark_resolved", () => {
    const actions = getRowActions({ status: "open", actionType: "prepare_invoice" })
    const byKey = Object.fromEntries(actions.map((x) => [x.key, x]))
    expect(byKey.mark_in_progress?.enabled).toBe(true)
    expect(byKey.mark_resolved?.enabled).toBe(true)
  })

  it("resolved item disables mark_in_progress and mark_resolved", () => {
    const actions = getRowActions({ status: "resolved", actionType: "prepare_invoice" })
    const byKey = Object.fromEntries(actions.map((x) => [x.key, x]))
    expect(byKey.mark_in_progress?.enabled).toBe(false)
    expect(byKey.mark_resolved?.enabled).toBe(false)
  })
})
