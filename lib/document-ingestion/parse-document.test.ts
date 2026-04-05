import { describe, expect, it, vi } from "vitest"

import { mergeWarnings, parseDocument } from "./parse-document"
import { PDF_LIMITED_WARNING } from "./parsers/parse-pdf"
import { WORD_LIMITED_WARNING } from "./parsers/parse-word"
import * as parseExcelModule from "./parsers/parse-excel"

describe("mergeWarnings", () => {
  it("orders classifier first and dedupes exact strings", () => {
    expect(mergeWarnings(["a", "b"], ["b", "c"])).toEqual(["a", "b", "c"])
    expect(mergeWarnings([], ["x"])).toEqual(["x"])
  })
})

describe("parseDocument", () => {
  it("routes excel input through parseExcel and merges warnings", async () => {
    const spy = vi.spyOn(parseExcelModule, "parseExcel")

    const doc = await parseDocument({
      fileName: "soa.xlsx",
      rows: [{ Visit: "Screening", Procedure: "Consent", Quantity: "1", Fee: "$0" }],
    })

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith({
      fileName: "soa.xlsx",
      rows: [{ Visit: "Screening", Procedure: "Consent", Quantity: "1", Fee: "$0" }],
    })

    expect(doc.sourceType).toBe("excel")
    expect(doc.parserId).toBe("cliniq-parse-excel-v1")
    expect(doc.records).toHaveLength(1)
    expect(doc.records[0]?.kind).toBe("soa_activity")
    expect(doc.classificationConfidence).toBe(1)
    expect(doc.warnings).toEqual([])

    spy.mockRestore()
  })

  it("excel detected but rows missing: zero records and warning", async () => {
    const doc = await parseDocument({ fileName: "soa.xlsx" })
    expect(doc.sourceType).toBe("excel")
    expect(doc.records).toHaveLength(0)
    expect(doc.parserId).toBe("cliniq-parse-document-v1")
    expect(doc.warnings).toContain("Excel document detected but no rows were provided.")
  })

  it("excel with empty rows array: same as missing rows", async () => {
    const doc = await parseDocument({ fileName: "budget.xlsx", rows: [] })
    expect(doc.records).toHaveLength(0)
    expect(doc.warnings).toContain("Excel document detected but no rows were provided.")
  })

  it("pdf: routes to parsePdf; generic text yields limited parsing warnings", async () => {
    const doc = await parseDocument({
      fileName: "contract.pdf",
      rawText: "some text",
    })
    expect(doc.sourceType).toBe("pdf")
    expect(doc.parserId).toBe("cliniq-parse-pdf-v1")
    expect(doc.records).toHaveLength(0)
    expect(doc.warnings).toContain(PDF_LIMITED_WARNING)
    expect(doc.warnings.some((w) => w.includes("structured data"))).toBe(true)
  })

  it("word: routes to parseWord; generic text yields limited parsing warnings", async () => {
    const doc = await parseDocument({
      fileName: "agreement.docx",
      rawText: "some text",
    })
    expect(doc.sourceType).toBe("word")
    expect(doc.parserId).toBe("cliniq-parse-word-v1")
    expect(doc.records).toHaveLength(0)
    expect(doc.warnings).toContain(WORD_LIMITED_WARNING)
    expect(doc.warnings.some((w) => w.includes("structured data"))).toBe(true)
  })

  it("unknown file type: zero records and unsupported warning", async () => {
    const doc = await parseDocument({ fileName: "data.bin" })
    expect(doc.sourceType).toBe("unknown")
    expect(doc.records).toHaveLength(0)
    expect(doc.warnings).toContain("Unsupported or unrecognized document type.")
  })

  it("preserves classifier warnings (e.g. extension vs mime mismatch)", async () => {
    const doc = await parseDocument({
      fileName: "report.xlsx",
      mimeType: "application/pdf",
      rows: [{ Visit: "V1", Procedure: "Labs", Quantity: "1", Fee: "$10" }],
    })

    expect(doc.warnings.some((w) => w.startsWith("mime_type_mismatch:"))).toBe(true)
    expect(doc.records).toHaveLength(1)
    expect(doc.sourceType).toBe("excel")
    expect(doc.classificationConfidence).toBe(0.65)
  })
})
