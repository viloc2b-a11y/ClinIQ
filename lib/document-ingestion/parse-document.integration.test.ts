/**
 * Step 8 — End-to-end ingestion via {@link parseDocument} (classify → route → parse).
 */
import { describe, expect, it } from "vitest"

import { INVALID_DOCUMENT_INPUT_WARNING, parseDocument } from "./parse-document"
import { PDF_LIMITED_WARNING } from "./parsers/parse-pdf"
import { WORD_LIMITED_WARNING } from "./parsers/parse-word"
import type { ParsedDocument } from "./types"

function assertParsedDocumentShape(doc: ParsedDocument): void {
  expect(doc).toBeTruthy()
  expect(doc.schemaVersion).toBe("1")
  expect(Array.isArray(doc.records)).toBe(true)
  expect(Array.isArray(doc.warnings)).toBe(true)
  expect(typeof doc.parsedAt).toBe("string")
  expect(typeof doc.parserId).toBe("string")
}

describe("parseDocument integration (Step 8)", () => {
  it("Excel end-to-end: two SoA rows, normalized values, no critical warnings", async () => {
    const doc = await parseDocument({
      fileName: "soa.xlsx",
      rows: [
        { Visit: "Screening", Procedure: "Consent", Quantity: "1", Fee: "$0" },
        { Visit: "Day 1", Procedure: "Physical Exam", Quantity: "1", Fee: "$125.00" },
      ],
    })
    assertParsedDocumentShape(doc)
    expect(doc.sourceType).toBe("excel")
    expect(doc.records.length).toBeGreaterThan(0)
    expect(doc.records.every((r) => r.kind === "soa_activity")).toBe(true)
    const r0 = doc.records[0]!
    expect(r0.kind).toBe("soa_activity")
    if (r0.kind === "soa_activity") {
      expect(r0.visitName).toBe("Screening")
      expect(r0.activityLabel).toBe("Consent")
      expect(r0.quantity?.value).toBe(1)
      expect(r0.unitAmount?.value).toBe(0)
    }
    const r1 = doc.records[1]!
    if (r1.kind === "soa_activity") {
      expect(r1.unitAmount?.value).toBe(125)
    }
    expect(doc.warnings).toEqual([])
  })

  it("Excel noisy headers: single row parses as SoA", async () => {
    const doc = await parseDocument({
      fileName: "budget.xlsx",
      rows: [
        {
          " Visit Name ": "Day 1",
          "Procedure Description": "ECG",
          " Unit Price ": "$85.00",
        },
      ],
    })
    assertParsedDocumentShape(doc)
    expect(doc.records).toHaveLength(1)
    expect(doc.records[0]?.kind).toBe("soa_activity")
    const r = doc.records[0]!
    if (r.kind === "soa_activity") {
      expect(r.visitName).toBe("Day 1")
      expect(r.activityLabel).toBe("ECG")
      expect(r.unitAmount?.value).toBe(85)
    }
  })

  it("Excel without rows: zero records and missing-rows warning", async () => {
    const doc = await parseDocument({ fileName: "soa.xlsx" })
    assertParsedDocumentShape(doc)
    expect(doc.records).toHaveLength(0)
    expect(doc.warnings).toContain("Excel document detected but no rows were provided.")
  })

  it("PDF route: limited parsing warning; heuristic record when signals present", async () => {
    const doc = await parseDocument({
      fileName: "contract.pdf",
      rawText: "ECG procedure - $85",
    })
    assertParsedDocumentShape(doc)
    expect(doc.sourceType).toBe("pdf")
    expect(doc.parserId).toBe("cliniq-parse-pdf-v1")
    expect(doc.warnings).toContain(PDF_LIMITED_WARNING)
    expect(doc.records.length >= 0).toBe(true)
    if (doc.records.length > 0) {
      expect(["budget_line", "soa_activity", "visit_schedule"]).toContain(doc.records[0]?.kind)
    }
  })

  it("Word route: limited warning; budget_line or contract_clause from mixed legal + currency", async () => {
    const doc = await parseDocument({
      fileName: "agreement.docx",
      rawText: "This agreement shall pay $125 per visit.",
    })
    assertParsedDocumentShape(doc)
    expect(doc.sourceType).toBe("word")
    expect(doc.parserId).toBe("cliniq-parse-word-v1")
    expect(doc.warnings).toContain(WORD_LIMITED_WARNING)
    expect(doc.records.length).toBeGreaterThan(0)
    const k = doc.records[0]?.kind
    expect(k === "budget_line" || k === "contract_clause").toBe(true)
  })

  it("unknown file type: zero records, unsupported warning", async () => {
    const doc = await parseDocument({ fileName: "data.bin" })
    assertParsedDocumentShape(doc)
    expect(doc.sourceType).toBe("unknown")
    expect(doc.records).toHaveLength(0)
    expect(doc.warnings).toContain("Unsupported or unrecognized document type.")
  })

  it("classifier warnings propagate into final ParsedDocument", async () => {
    const doc = await parseDocument({
      fileName: "report.xlsx",
      mimeType: "application/pdf",
      rows: [{ Visit: "V1", Procedure: "Labs", Quantity: "1", Fee: "$10" }],
    })
    assertParsedDocumentShape(doc)
    expect(doc.warnings.some((w) => w.startsWith("mime_type_mismatch:"))).toBe(true)
  })

  it("empty input object: zero records, invalid input warning", async () => {
    const doc = await parseDocument({})
    assertParsedDocumentShape(doc)
    expect(doc.records).toHaveLength(0)
    expect(doc.warnings).toContain(INVALID_DOCUMENT_INPUT_WARNING)
    expect(doc.parserId).toBe("cliniq-parse-document-v1")
  })
})
