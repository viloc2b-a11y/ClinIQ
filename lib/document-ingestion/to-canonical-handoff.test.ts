import { describe, expect, it } from "vitest"

import { recordHasLowConfidenceField, toCanonicalHandoff } from "./to-canonical-handoff"
import type { BudgetLineRecord, ParsedDocument, SoaActivityRecord } from "./types"
import { PARSED_DOCUMENT_SCHEMA_VERSION } from "./types"

function doc(overrides: Partial<ParsedDocument>): ParsedDocument {
  return {
    schemaVersion: PARSED_DOCUMENT_SCHEMA_VERSION,
    sourceType: "excel",
    parsedAt: "2026-04-04T12:00:00.000Z",
    parserId: "test-parser",
    records: [],
    warnings: [],
    ...overrides,
  }
}

describe("toCanonicalHandoff", () => {
  it("empty document: zero counts, no low confidence, no warnings flag", () => {
    const h = toCanonicalHandoff(doc({}))
    expect(h.records).toEqual([])
    expect(h.warnings).toEqual([])
    expect(h.summary.totalRecords).toBe(0)
    expect(h.summary.byType).toEqual({})
    expect(h.summary.hasLowConfidence).toBe(false)
    expect(h.summary.hasWarnings).toBe(false)
  })

  it("mixed record types: byType counts sorted keys", () => {
    const soa: SoaActivityRecord = {
      kind: "soa_activity",
      recordId: "a",
      visitName: "V1",
      activityLabel: "Labs",
      quantity: { value: 1, confidence: "high" },
      unitAmount: { value: 10, confidence: "high" },
    }
    const budget: BudgetLineRecord = {
      kind: "budget_line",
      recordId: "b",
      label: "Startup",
      expectedAmount: { value: 100, confidence: "high" },
    }
    const h = toCanonicalHandoff(doc({ records: [soa, budget] }))
    expect(h.summary.totalRecords).toBe(2)
    expect(h.summary.byType).toEqual({
      budget_line: 1,
      soa_activity: 1,
    })
    expect(Object.keys(h.summary.byType)).toEqual(["budget_line", "soa_activity"])
  })

  it("hasLowConfidence when any ParsedField uses low", () => {
    const r: BudgetLineRecord = {
      kind: "budget_line",
      recordId: "x",
      label: "L",
      expectedAmount: { value: null, confidence: "low" },
    }
    expect(recordHasLowConfidenceField(r)).toBe(true)
    const h = toCanonicalHandoff(doc({ records: [r] }))
    expect(h.summary.hasLowConfidence).toBe(true)
  })

  it("hasLowConfidence false when only high/medium/unverified", () => {
    const r: SoaActivityRecord = {
      kind: "soa_activity",
      recordId: "y",
      activityLabel: "A",
      quantity: { value: 1, confidence: "unverified" },
      unitAmount: { value: 2, confidence: "medium" },
    }
    expect(toCanonicalHandoff(doc({ records: [r] })).summary.hasLowConfidence).toBe(false)
  })

  it("warnings propagate unchanged and set hasWarnings", () => {
    const w = ["Row 1 skipped: empty row."]
    const h = toCanonicalHandoff(doc({ warnings: w, records: [] }))
    expect(h.warnings).toEqual(w)
    expect(h.summary.hasWarnings).toBe(true)
  })

  it("deterministic byType for same multiset of kinds", () => {
    const records: ParsedDocument["records"] = [
      {
        kind: "visit_schedule",
        recordId: "v",
        visitName: "S",
        visitNumber: { value: null, confidence: "low" },
      },
      {
        kind: "soa_activity",
        recordId: "s",
        activityLabel: "P",
        quantity: { value: null, confidence: "high" },
        unitAmount: { value: null, confidence: "high" },
      },
      {
        kind: "soa_activity",
        recordId: "s2",
        activityLabel: "Q",
        quantity: { value: null, confidence: "high" },
        unitAmount: { value: null, confidence: "high" },
      },
    ]
    const a = toCanonicalHandoff(doc({ records }))
    const b = toCanonicalHandoff(doc({ records: [...records] }))
    expect(a.summary.byType).toEqual(b.summary.byType)
    expect(a.summary.byType).toEqual({
      soa_activity: 2,
      visit_schedule: 1,
    })
  })
})
