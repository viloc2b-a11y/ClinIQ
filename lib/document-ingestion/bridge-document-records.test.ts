import { describe, expect, it } from "vitest"

import { bridgeDocumentRecords } from "./bridge-document-records"
import type { ParsedDocument, ParsedDocumentRecord } from "./types"
import { PARSED_DOCUMENT_SCHEMA_VERSION } from "./types"

function baseDoc(overrides: Partial<ParsedDocument> = {}): ParsedDocument {
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

describe("bridgeDocumentRecords", () => {
  it("maps soa_activity correctly (including sparse rows)", () => {
    const out = bridgeDocumentRecords({
      parsedDocument: baseDoc({
        records: [
          {
            recordId: "soa-1",
            kind: "soa_activity",
            visitName: "Visit 2",
            activityLabel: "ECG",
            quantity: { value: 3, confidence: "high" },
            unitAmount: { value: 25, confidence: "low" },
          },
          { recordId: "soa-2", kind: "soa_activity" },
        ],
      }),
    })
    expect(out.soaCandidates).toHaveLength(2)
    expect(out.soaCandidates[0]).toEqual({
      sourceRecordIndex: 0,
      visitName: "Visit 2",
      activityName: "ECG",
      quantity: 3,
      unitPrice: 25,
      totalPrice: 75,
      notes: null,
      confidence: "low",
    })
    expect(out.soaCandidates[1]).toMatchObject({
      sourceRecordIndex: 1,
      visitName: null,
      activityName: null,
      quantity: null,
      unitPrice: null,
      totalPrice: null,
      notes: null,
      confidence: null,
    })
  })

  it("maps budget_line correctly", () => {
    const out = bridgeDocumentRecords({
      parsedDocument: baseDoc({
        records: [
          {
            recordId: "bud-1",
            kind: "budget_line",
            label: "Site startup",
            expectedQuantity: { value: 1, confidence: "medium" },
            unitPrice: { value: 5000, confidence: "high" },
            expectedAmount: { value: 5000, confidence: "high" },
            notes: "Fixed fee",
          },
        ],
      }),
    })
    expect(out.budgetCandidates).toHaveLength(1)
    expect(out.budgetCandidates[0]).toEqual({
      sourceRecordIndex: 0,
      activityName: "Site startup",
      quantity: 1,
      unitPrice: 5000,
      totalPrice: 5000,
      notes: "Fixed fee",
      confidence: "medium",
    })
  })

  it("maps invoice_line correctly (description preferred; lineCode fallback)", () => {
    const out = bridgeDocumentRecords({
      parsedDocument: baseDoc({
        records: [
          {
            recordId: "inv-1",
            kind: "invoice_line",
            description: "Monitoring visit",
            lineCode: "MV-01",
            quantity: { value: 4, confidence: "high" },
            unitPrice: { value: 200, confidence: "unverified" },
            lineAmount: { value: 800, confidence: "high" },
          },
          {
            recordId: "inv-2",
            kind: "invoice_line",
            lineCode: "CODE-9",
            lineAmount: { value: 99, confidence: "high" },
          },
        ],
      }),
    })
    expect(out.invoiceCandidates).toHaveLength(2)
    expect(out.invoiceCandidates[0]).toEqual({
      sourceRecordIndex: 0,
      visitName: null,
      activityName: "Monitoring visit",
      quantity: 4,
      unitPrice: 200,
      totalPrice: 800,
      notes: null,
      confidence: "unverified",
    })
    expect(out.invoiceCandidates[1]!.activityName).toBe("CODE-9")
  })

  it("maps contract_clause correctly", () => {
    const out = bridgeDocumentRecords({
      parsedDocument: baseDoc({
        records: [
          {
            recordId: "ctr-1",
            kind: "contract_clause",
            clauseType: "payment_terms",
            sectionReference: "§ 5.2",
            title: "Payment timing",
            excerpt: "Net 45 from receipt of invoice.",
            booleanValue: { value: true, confidence: "medium" },
          },
        ],
      }),
    })
    expect(out.contractCandidates).toHaveLength(1)
    expect(out.contractCandidates[0]).toMatchObject({
      sourceRecordIndex: 0,
      clauseText: "Net 45 from receipt of invoice.",
      notes: "Payment timing — § 5.2",
      confidence: "medium",
    })
  })

  it("maps visit_schedule correctly", () => {
    const out = bridgeDocumentRecords({
      parsedDocument: baseDoc({
        records: [
          {
            recordId: "vs-1",
            kind: "visit_schedule",
            visitName: "Week 12",
            visitNumber: { value: 5, confidence: "high" },
            targetStudyDay: { value: 84, confidence: "low" },
            windowStartDay: { value: 80, confidence: "high" },
            windowEndDay: { value: 88, confidence: "high" },
            notes: "Labs required",
          },
        ],
      }),
    })
    expect(out.visitScheduleCandidates).toHaveLength(1)
    expect(out.visitScheduleCandidates[0]).toEqual({
      sourceRecordIndex: 0,
      visitName: "Week 12",
      notes: "Labs required",
      confidence: "low",
    })
  })

  it("preserves sourceRecordIndex for each bucket", () => {
    const out = bridgeDocumentRecords({
      parsedDocument: baseDoc({
        records: [
          { recordId: "a", kind: "soa_activity" },
          { recordId: "b", kind: "budget_line" },
          { recordId: "c", kind: "invoice_line", lineCode: "X" },
        ],
      }),
    })
    expect(out.soaCandidates[0]!.sourceRecordIndex).toBe(0)
    expect(out.budgetCandidates[0]!.sourceRecordIndex).toBe(1)
    expect(out.invoiceCandidates[0]!.sourceRecordIndex).toBe(2)
  })

  it("propagates parsedDocument warnings and adds aggregate when unmapped", () => {
    const unknown = {
      recordId: "u1",
      kind: "legacy_row",
    } as unknown as ParsedDocumentRecord

    const out = bridgeDocumentRecords({
      parsedDocument: baseDoc({
        warnings: ["Header row inferred."],
        records: [unknown],
      }),
    })
    expect(out.warnings[0]).toBe("Header row inferred.")
    expect(out.warnings).toContain("Some document records could not be mapped to candidate buckets.")
  })

  it("counts summary correctly (byInputType, byOutputBucket, mapped vs unmapped)", () => {
    const unknown = { recordId: "x", kind: "other" } as unknown as ParsedDocumentRecord
    const out = bridgeDocumentRecords({
      parsedDocument: baseDoc({
        records: [
          { recordId: "1", kind: "soa_activity" },
          { recordId: "2", kind: "soa_activity" },
          { recordId: "3", kind: "budget_line" },
          unknown,
        ],
      }),
    })
    expect(out.summary.totalInputRecords).toBe(4)
    expect(out.summary.totalMappedCandidates).toBe(3)
    expect(out.summary.unmappedRecords).toBe(1)
    expect(out.summary.byInputType).toEqual({
      budget_line: 1,
      other: 1,
      soa_activity: 2,
    })
    expect(out.summary.byOutputBucket).toEqual({
      budgetCandidates: 1,
      contractCandidates: 0,
      invoiceCandidates: 0,
      soaCandidates: 2,
      visitScheduleCandidates: 0,
    })
  })

  it("handles empty document", () => {
    const out = bridgeDocumentRecords({ parsedDocument: baseDoc() })
    expect(out.soaCandidates).toEqual([])
    expect(out.summary.totalInputRecords).toBe(0)
    expect(out.summary.totalMappedCandidates).toBe(0)
    expect(out.summary.unmappedRecords).toBe(0)
    expect(out.warnings).toEqual([])
  })

  it("handles unsupported record types conservatively without throwing", () => {
    const junk = { recordId: "j", kind: "not_a_real_kind" } as unknown as ParsedDocumentRecord
    const out = bridgeDocumentRecords({
      parsedDocument: baseDoc({ records: [junk] }),
    })
    expect(out.summary.unmappedRecords).toBe(1)
    expect(out.summary.totalMappedCandidates).toBe(0)
    expect(out.soaCandidates).toHaveLength(0)
  })

})
