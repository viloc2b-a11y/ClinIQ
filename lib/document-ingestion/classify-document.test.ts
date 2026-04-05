import { describe, expect, it } from "vitest"

import { classifyDocument } from "./classify-document"

describe("classifyDocument", () => {
  it("detects excel from .xlsx and .xls", () => {
    expect(classifyDocument({ fileName: "budget.xlsx" })).toEqual({
      sourceType: "excel",
      confidence: 1,
      warnings: [],
    })
    expect(classifyDocument({ fileName: "legacy.XLS" })).toEqual({
      sourceType: "excel",
      confidence: 1,
      warnings: [],
    })
  })

  it("detects pdf from .pdf", () => {
    expect(classifyDocument({ fileName: "C:\\docs\\SoA.pdf" })).toEqual({
      sourceType: "pdf",
      confidence: 1,
      warnings: [],
    })
  })

  it("detects word from .docx and .doc", () => {
    expect(classifyDocument({ fileName: "contract.docx" })).toEqual({
      sourceType: "word",
      confidence: 1,
      warnings: [],
    })
    expect(classifyDocument({ fileName: "old.DOC" })).toEqual({
      sourceType: "word",
      confidence: 1,
      warnings: [],
    })
  })

  it("returns unknown for unrecognized files", () => {
    const r = classifyDocument({ fileName: "notes.txt" })
    expect(r.sourceType).toBe("unknown")
    expect(r.confidence).toBe(0.15)
    expect(r.warnings).toContain("unrecognized_file_extension: .txt")
    expect(r.warnings).toContain("could_not_classify_document_source")
  })

  it("warns on mismatch between extension and mimeType", () => {
    const r = classifyDocument({
      fileName: "report.xlsx",
      mimeType: "application/pdf",
    })
    expect(r.sourceType).toBe("excel")
    expect(r.confidence).toBe(0.65)
    expect(r.warnings.some((w) => w.startsWith("mime_type_mismatch:"))).toBe(true)
  })

  it("uses mimeType when extension is missing", () => {
    const r = classifyDocument({
      fileName: "download",
      mimeType: "application/pdf",
    })
    expect(r).toEqual({
      sourceType: "pdf",
      confidence: 0.85,
      warnings: ["no_file_extension"],
    })
  })

  it("strips mime parameters before mapping", () => {
    const r = classifyDocument({
      fileName: "blob",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; charset=binary",
    })
    expect(r.sourceType).toBe("excel")
    expect(r.confidence).toBe(0.85)
    expect(r.warnings).toEqual(["no_file_extension"])
  })
})
