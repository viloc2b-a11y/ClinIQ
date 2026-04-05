import { describe, expect, it } from "vitest"

import type { LeakageTraceItem, LeakageTraceResult } from "../post-award-ledger/leakage-types"
import { deterministicActionCenterItemId } from "./build-action-center"
import { buildActionCenterFromLeakageTrace } from "./build-from-leakage-trace"

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

describe("buildActionCenterFromLeakageTrace", () => {
  it("maps trace items to open actions with summary", () => {
    const trace: LeakageTraceResult = {
      items: [
        traceItem({
          studyId: "S-1",
          lineCode: "V1",
          visitName: "Visit 1",
          subjectId: "SUB-1",
          reason: "not_invoiced",
          status: "missing",
          actionHint: "prepare_invoice",
          expectedAmount: 120,
          invoicedAmount: 0,
          missingAmount: 120,
        }),
      ],
      summary: {
        totalExpectedAmount: 120,
        totalInvoicedAmount: 0,
        totalMissingAmount: 120,
        itemCount: 1,
        missingCount: 1,
        partialCount: 0,
        blockedCount: 0,
      },
    }
    const ac = buildActionCenterFromLeakageTrace(trace)
    expect(ac.items).toHaveLength(1)
    expect(ac.items[0].status).toBe("open")
    expect(ac.items[0].actionType).toBe("prepare_invoice")
    expect(ac.items[0].ownerRole).toBe("billing")
    expect(ac.items[0].id).toBe("S-1::SUB-1::Visit 1::V1::not_invoiced")
    expect(ac.items[0].title).toBe("Prepare invoice for V1 on Visit 1")
    expect(ac.items[0].description).toBe(
      "SUB-1 / Visit 1 / V1 has $120 missing because it was not invoiced.",
    )
    expect(ac.items[0].leakageReason).toBe("not_invoiced")
    expect(ac.items[0].leakageStatus).toBe("missing")
    expect(ac.summary.totalOpen).toBe(1)
    expect(ac.summary.byOwnerRole.billing).toBe(1)
    expect(ac.summary.byActionType.prepare_invoice).toBe(1)
    expect(ac.summary.totalMissingAmount).toBe(120)
  })

  it("deterministic id: same trace yields same id", () => {
    const t = traceItem({
      studyId: "STUDY-1",
      lineCode: "ECG",
      visitName: "Visit 3",
      subjectId: "SUB-001",
      reason: "not_invoiced",
      status: "missing",
      eventLogId: "evt-1",
    })
    expect(deterministicActionCenterItemId(t)).toBe(deterministicActionCenterItemId(t))
  })

  it("resolve_blocking_issue hint → resolve_claim_issue + site_manager when requires_review", () => {
    const ac = buildActionCenterFromLeakageTrace({
      items: [
        traceItem({
          studyId: "S",
          lineCode: "L",
          visitName: "V",
          reason: "requires_review",
          status: "not_invoice_ready",
          actionHint: "resolve_blocking_issue",
          missingAmount: 0,
        }),
      ],
      summary: {
        totalExpectedAmount: 0,
        totalInvoicedAmount: 0,
        totalMissingAmount: 0,
        itemCount: 1,
        missingCount: 0,
        partialCount: 0,
        blockedCount: 1,
      },
    })
    expect(ac.items[0].actionType).toBe("resolve_claim_issue")
    expect(ac.items[0].ownerRole).toBe("site_manager")
    expect(ac.items[0].priority).toBe("high")
  })

  it("resolve_claim_issue + claim_blocked → finance owner", () => {
    const ac = buildActionCenterFromLeakageTrace({
      items: [
        traceItem({
          studyId: "S",
          lineCode: "CBC",
          visitName: "Screening",
          subjectId: "SUB-010",
          reason: "claim_blocked",
          status: "not_invoice_ready",
          actionHint: "resolve_blocking_issue",
          missingAmount: 50,
        }),
      ],
      summary: {
        totalExpectedAmount: 50,
        totalInvoicedAmount: 0,
        totalMissingAmount: 50,
        itemCount: 1,
        missingCount: 0,
        partialCount: 0,
        blockedCount: 1,
      },
    })
    expect(ac.items[0].ownerRole).toBe("finance")
    expect(ac.items[0].priority).toBe("high")
  })

  it("priority medium when missingAmount in [250, 1000) and no force-high rule", () => {
    const ac = buildActionCenterFromLeakageTrace({
      items: [
        traceItem({
          studyId: "S",
          lineCode: "X",
          visitName: "V",
          reason: "not_invoiced",
          status: "missing",
          actionHint: "prepare_invoice",
          missingAmount: 500,
        }),
      ],
      summary: {
        totalExpectedAmount: 500,
        totalInvoicedAmount: 0,
        totalMissingAmount: 500,
        itemCount: 1,
        missingCount: 1,
        partialCount: 0,
        blockedCount: 0,
      },
    })
    expect(ac.items[0].priority).toBe("medium")
  })

  it("sorts by priority then studyId, subjectId, visitName, lineCode", () => {
    const trace: LeakageTraceResult = {
      items: [
        traceItem({
          studyId: "B",
          lineCode: "L2",
          visitName: "V1",
          subjectId: "S1",
          reason: "not_invoiced",
          status: "missing",
          actionHint: "prepare_invoice",
          missingAmount: 10,
        }),
        traceItem({
          studyId: "A",
          lineCode: "L1",
          visitName: "V1",
          subjectId: "S1",
          reason: "not_invoiced",
          status: "missing",
          actionHint: "prepare_invoice",
          missingAmount: 2000,
        }),
      ],
      summary: {
        totalExpectedAmount: 2010,
        totalInvoicedAmount: 0,
        totalMissingAmount: 2010,
        itemCount: 2,
        missingCount: 2,
        partialCount: 0,
        blockedCount: 0,
      },
    }
    const ac = buildActionCenterFromLeakageTrace(trace)
    expect(ac.items.map((i) => i.lineCode)).toEqual(["L1", "L2"])
  })

  it("two runs same input → identical JSON", () => {
    const trace: LeakageTraceResult = {
      items: [
        traceItem({
          studyId: "A",
          lineCode: "X",
          visitName: "Y",
          reason: "partially_invoiced",
          status: "partial",
          actionHint: "prepare_invoice",
          expectedAmount: 100,
          invoicedAmount: 40,
          missingAmount: 60,
        }),
      ],
      summary: {
        totalExpectedAmount: 100,
        totalInvoicedAmount: 40,
        totalMissingAmount: 60,
        itemCount: 1,
        missingCount: 0,
        partialCount: 1,
        blockedCount: 0,
      },
    }
    const a = buildActionCenterFromLeakageTrace(trace)
    const b = buildActionCenterFromLeakageTrace(trace)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })
})
