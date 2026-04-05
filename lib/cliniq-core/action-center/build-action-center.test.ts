import { describe, expect, it } from "vitest"

import type { LeakageTraceItem, LeakageTraceResult } from "../post-award-ledger/leakage-types"
import { buildActionCenter, deterministicActionCenterItemId } from "./build-action-center"

function traceItem(
  overrides: Partial<LeakageTraceItem> &
    Pick<LeakageTraceItem, "studyId" | "lineCode" | "visitName">,
): LeakageTraceItem {
  return {
    subjectId: "",
    expectedAmount: 100,
    invoicedAmount: 0,
    missingAmount: 100,
    status: "missing",
    reason: "not_generated",
    actionHint: "check_event_mapping",
    ...overrides,
  }
}

function emptySummary(overrides: Partial<LeakageTraceResult["summary"]> = {}): LeakageTraceResult["summary"] {
  return {
    totalExpectedAmount: 0,
    totalInvoicedAmount: 0,
    totalMissingAmount: 0,
    itemCount: 0,
    missingCount: 0,
    partialCount: 0,
    blockedCount: 0,
    ...overrides,
  }
}

describe("buildActionCenter", () => {
  it("maps missing invoice to billing action (not_invoiced → prepare_invoice, billing)", () => {
    const leakageTrace: LeakageTraceResult = {
      items: [
        traceItem({
          studyId: "ST",
          lineCode: "ECG",
          visitName: "Visit 3",
          subjectId: "SUB-001",
          reason: "not_invoiced",
          status: "missing",
          actionHint: "prepare_invoice",
          expectedAmount: 120,
          invoicedAmount: 0,
          missingAmount: 120,
        }),
      ],
      summary: emptySummary({
        totalExpectedAmount: 120,
        totalMissingAmount: 120,
        itemCount: 1,
        missingCount: 1,
      }),
    }
    const ac = buildActionCenter({ leakageTrace })
    expect(ac.items).toHaveLength(1)
    expect(ac.items[0].actionType).toBe("prepare_invoice")
    expect(ac.items[0].ownerRole).toBe("billing")
    expect(ac.items[0].leakageReason).toBe("not_invoiced")
  })

  it("maps missing documentation to coordinator (collect_documentation, coordinator)", () => {
    const leakageTrace: LeakageTraceResult = {
      items: [
        traceItem({
          studyId: "ST",
          lineCode: "LABS",
          visitName: "Screening",
          subjectId: "SUB-002",
          reason: "missing_documentation",
          status: "not_invoice_ready",
          actionHint: "collect_documentation",
          missingAmount: 80,
          expectedAmount: 80,
        }),
      ],
      summary: emptySummary({ itemCount: 1, blockedCount: 1 }),
    }
    const ac = buildActionCenter({ leakageTrace })
    expect(ac.items[0].actionType).toBe("collect_documentation")
    expect(ac.items[0].ownerRole).toBe("coordinator")
    expect(ac.items[0].leakageReason).toBe("missing_documentation")
  })

  it("maps blocked claims: resolve_claim_issue, deterministic owners, priority high", () => {
    const leakageTrace: LeakageTraceResult = {
      items: [
        traceItem({
          studyId: "S",
          lineCode: "PROC_A",
          visitName: "V1",
          subjectId: "S1",
          reason: "claim_blocked",
          status: "not_invoice_ready",
          actionHint: "resolve_blocking_issue",
          missingAmount: 10,
        }),
        traceItem({
          studyId: "S",
          lineCode: "PROC_B",
          visitName: "V1",
          subjectId: "S1",
          reason: "requires_review",
          status: "not_invoice_ready",
          actionHint: "resolve_blocking_issue",
          missingAmount: 5,
        }),
      ],
      summary: emptySummary({ itemCount: 2, blockedCount: 2 }),
    }
    const ac = buildActionCenter({ leakageTrace })
    const byLine = Object.fromEntries(ac.items.map((i) => [i.lineCode, i]))
    expect(byLine.PROC_A.actionType).toBe("resolve_claim_issue")
    expect(byLine.PROC_B.actionType).toBe("resolve_claim_issue")
    expect(byLine.PROC_A.ownerRole).toBe("finance")
    expect(byLine.PROC_B.ownerRole).toBe("site_manager")
    expect(ac.items.every((i) => i.priority === "high")).toBe(true)
  })

  it("priority rules: 50 → low, 400 → medium, 1500 → high (no blocked force)", () => {
    const base = {
      studyId: "P",
      visitName: "V",
      subjectId: "SUB",
      reason: "not_invoiced" as const,
      status: "missing" as const,
      actionHint: "prepare_invoice" as const,
      invoicedAmount: 0,
    }
    const leakageTrace: LeakageTraceResult = {
      items: [
        traceItem({ ...base, lineCode: "L50", missingAmount: 50, expectedAmount: 50 }),
        traceItem({ ...base, lineCode: "L400", missingAmount: 400, expectedAmount: 400 }),
        traceItem({ ...base, lineCode: "L1500", missingAmount: 1500, expectedAmount: 1500 }),
      ],
      summary: emptySummary({ itemCount: 3, missingCount: 3 }),
    }
    const ac = buildActionCenter({ leakageTrace })
    const p = Object.fromEntries(ac.items.map((i) => [i.lineCode, i.priority]))
    expect(p.L50).toBe("low")
    expect(p.L400).toBe("medium")
    expect(p.L1500).toBe("high")
  })

  it("deterministic id: same leakage input yields same action ids every time", () => {
    const leakageTrace: LeakageTraceResult = {
      items: [
        traceItem({
          studyId: "A",
          lineCode: "X",
          visitName: "Y",
          subjectId: "Z",
          reason: "not_invoiced",
          status: "missing",
          actionHint: "prepare_invoice",
          missingAmount: 1,
        }),
      ],
      summary: emptySummary({ itemCount: 1, missingCount: 1 }),
    }
    const id1 = buildActionCenter({ leakageTrace }).items[0].id
    const id2 = buildActionCenter({ leakageTrace }).items[0].id
    expect(id1).toBe(id2)
    expect(id1).toBe(deterministicActionCenterItemId(leakageTrace.items[0]))
    expect(id1).toBe("A::Z::Y::X::not_invoiced")
  })

  it("sorting: high before medium before low, then studyId, subjectId, visitName, lineCode", () => {
    const leakageTrace: LeakageTraceResult = {
      items: [
        traceItem({
          studyId: "B",
          lineCode: "Z_LINE",
          visitName: "Va",
          subjectId: "S2",
          reason: "not_invoiced",
          status: "missing",
          actionHint: "prepare_invoice",
          missingAmount: 10,
        }),
        traceItem({
          studyId: "A",
          lineCode: "A_LINE",
          visitName: "Vb",
          subjectId: "S1",
          reason: "not_invoiced",
          status: "missing",
          actionHint: "prepare_invoice",
          missingAmount: 2000,
        }),
        traceItem({
          studyId: "A",
          lineCode: "B_LINE",
          visitName: "Vb",
          subjectId: "S1",
          reason: "not_invoiced",
          status: "missing",
          actionHint: "prepare_invoice",
          missingAmount: 300,
        }),
      ],
      summary: emptySummary({ itemCount: 3, missingCount: 3 }),
    }
    const ac = buildActionCenter({ leakageTrace })
    expect(ac.items.map((i) => i.priority)).toEqual(["high", "medium", "low"])
    expect(ac.items.map((i) => i.lineCode)).toEqual(["A_LINE", "B_LINE", "Z_LINE"])
  })

  it("stable secondary sort when priority ties (studyId, subjectId, visitName, lineCode)", () => {
    const low = {
      reason: "not_invoiced" as const,
      status: "missing" as const,
      actionHint: "prepare_invoice" as const,
      studyId: "S",
      visitName: "V",
      subjectId: "U",
      invoicedAmount: 0,
      missingAmount: 10,
    }
    const leakageTrace: LeakageTraceResult = {
      items: [
        traceItem({ ...low, lineCode: "ZED" }),
        traceItem({ ...low, lineCode: "AMY" }),
      ],
      summary: emptySummary({ itemCount: 2, missingCount: 2 }),
    }
    const ac = buildActionCenter({ leakageTrace })
    expect(ac.items.map((i) => i.lineCode)).toEqual(["AMY", "ZED"])
  })

  it("summary: totals by owner and action type, totalMissingAmount", () => {
    const leakageTrace: LeakageTraceResult = {
      items: [
        traceItem({
          studyId: "S",
          lineCode: "I1",
          visitName: "V",
          subjectId: "U",
          reason: "not_invoiced",
          status: "missing",
          actionHint: "prepare_invoice",
          missingAmount: 100,
        }),
        traceItem({
          studyId: "S",
          lineCode: "I2",
          visitName: "V",
          subjectId: "U",
          reason: "missing_documentation",
          status: "not_invoice_ready",
          actionHint: "collect_documentation",
          missingAmount: 50,
        }),
        traceItem({
          studyId: "S",
          lineCode: "I3",
          visitName: "V",
          subjectId: "U",
          reason: "requires_review",
          status: "not_invoice_ready",
          actionHint: "resolve_blocking_issue",
          missingAmount: 0,
        }),
      ],
      summary: emptySummary({ itemCount: 3 }),
    }
    const ac = buildActionCenter({ leakageTrace })
    expect(ac.summary.totalOpen).toBe(3)
    expect(ac.summary.totalHighPriority).toBe(1)
    expect(ac.summary.totalMissingAmount).toBe(150)
    expect(ac.summary.byOwnerRole.billing).toBe(1)
    expect(ac.summary.byOwnerRole.coordinator).toBe(1)
    expect(ac.summary.byOwnerRole.site_manager).toBe(1)
    expect(ac.summary.byActionType.prepare_invoice).toBe(1)
    expect(ac.summary.byActionType.collect_documentation).toBe(1)
    expect(ac.summary.byActionType.resolve_claim_issue).toBe(1)
  })

  it("title and description are populated and deterministic across runs", () => {
    const leakageTrace: LeakageTraceResult = {
      items: [
        traceItem({
          studyId: "S",
          lineCode: "ECG",
          visitName: "Visit 3",
          subjectId: "SUB-001",
          reason: "not_invoiced",
          status: "missing",
          actionHint: "prepare_invoice",
          missingAmount: 120,
        }),
      ],
      summary: emptySummary({ itemCount: 1, missingCount: 1 }),
    }
    const a = buildActionCenter({ leakageTrace }).items[0]
    const b = buildActionCenter({ leakageTrace }).items[0]
    expect(a.title.length).toBeGreaterThan(0)
    expect(a.description.length).toBeGreaterThan(0)
    expect(a.title).toBe("Prepare invoice for ECG on Visit 3")
    expect(a.description).toBe(
      "SUB-001 / Visit 3 / ECG has $120 missing because it was not invoiced.",
    )
    expect(a.title).toBe(b.title)
    expect(a.description).toBe(b.description)
  })
})
