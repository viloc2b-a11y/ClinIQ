/**
 * Server-only: bytes → ParsedDocument pipeline branch → ParsedBudgetLine[].
 */

import { classifyDocument } from "@/lib/document-ingestion/classify-document"
import { parseExcel } from "@/lib/document-ingestion/parsers/parse-excel"
import { parsePdf } from "@/lib/document-ingestion/parsers/parse-pdf"
import { parseWord } from "@/lib/document-ingestion/parsers/parse-word"
import type { ClassifiedSourceType } from "@/lib/document-ingestion/classify-document"
import type { ParsedBudgetLine } from "./parsed-budget-line"
import { parsedRecordsToBudgetLines } from "./parsed-document-to-budget-lines"
import * as XLSX from "xlsx"

export type ParseUploadResult = {
  sourceType: ClassifiedSourceType
  lines: ParsedBudgetLine[]
  /** Session-level warnings (format limits, legacy file notice, etc.) */
  parserWarnings: string[]
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse")
  const parser = new PDFParse({ data: new Uint8Array(buffer) })
  try {
    const result = await parser.getText()
    return typeof result.text === "string" ? result.text : ""
  } finally {
    await parser.destroy()
  }
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth")
  const { value } = await mammoth.extractRawText({ buffer })
  return value ?? ""
}

function extensionFromName(fileName: string): string {
  const seg = fileName.replace(/\\/g, "/").split("/").pop() ?? ""
  const dot = seg.lastIndexOf(".")
  if (dot <= 0) return ""
  return seg.slice(dot + 1).toLowerCase()
}

/**
 * Parse an uploaded file buffer into canonical import lines.
 */
export async function parseUploadBuffer(options: {
  fileName: string
  mimeType?: string | null
  buffer: Buffer
}): Promise<ParseUploadResult> {
  const { fileName, mimeType, buffer } = options
  const ext = extensionFromName(fileName)
  const parserWarnings: string[] = []

  const classified = classifyDocument({
    fileName,
    mimeType: mimeType ?? undefined,
  })
  parserWarnings.push(...classified.warnings)

  let sourceType = classified.sourceType
  if (sourceType === "unknown") {
    return { sourceType: "unknown", lines: [], parserWarnings: [...parserWarnings, "Could not classify file type from name or MIME type."] }
  }

  if (sourceType === "excel") {
    if (ext === "xls") {
      parserWarnings.push(
        "Legacy .xls detected: parsing is best-effort. Prefer .xlsx for higher accuracy.",
      )
    }
    let workbook: XLSX.WorkBook
    try {
      workbook = XLSX.read(buffer, { type: "buffer", cellDates: true })
    } catch {
      return {
        sourceType: "excel",
        lines: [],
        parserWarnings: [
          ...parserWarnings,
          "Failed to read Excel workbook (corrupt or unsupported binary).",
        ],
      }
    }
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) {
      return {
        sourceType: "excel",
        lines: [],
        parserWarnings: [...parserWarnings, "Workbook has no sheets."],
      }
    }
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    })
    const doc = parseExcel({ fileName, sheetName, rows })
    parserWarnings.push(...doc.warnings)
    const lines = parsedRecordsToBudgetLines(doc.records, "excel")
    if (lines.length === 0) {
      parserWarnings.push(
        "No budget-like rows detected. Adjust the sheet or add rows manually after import.",
      )
    }
    return { sourceType: "excel", lines, parserWarnings }
  }

  if (sourceType === "pdf") {
    let rawText: string
    try {
      rawText = await extractPdfText(buffer)
    } catch {
      return {
        sourceType: "pdf",
        lines: [],
        parserWarnings: [
          ...parserWarnings,
          "PDF text extraction failed. Try exporting to .docx or .xlsx.",
        ],
      }
    }
    const doc = parsePdf({ fileName, rawText, tables: undefined })
    parserWarnings.push(...doc.warnings)
    const lines = parsedRecordsToBudgetLines(doc.records, "pdf")
    if (lines.length === 0) {
      parserWarnings.push(
        "PDF yielded no structured budget lines. Human review and manual lines are expected.",
      )
    }
    return { sourceType: "pdf", lines, parserWarnings }
  }

  if (sourceType === "word") {
    if (ext === "doc") {
      parserWarnings.push(
        "Legacy .doc is not reliably parsed. Please save as .docx and re-upload for better results.",
      )
    }
    let rawText: string
    try {
      rawText = await extractDocxText(buffer)
    } catch {
      return {
        sourceType: "word",
        lines: [],
        parserWarnings: [
          ...parserWarnings,
          "Word text extraction failed. Save as .docx and try again.",
        ],
      }
    }
    if (ext === "doc" && rawText.trim().length < 20) {
      return {
        sourceType: "word",
        lines: [],
        parserWarnings: [
          ...parserWarnings,
          ".doc binary format could not be read as text. Convert to .docx.",
        ],
      }
    }
    const doc = parseWord({ fileName, rawText, sections: undefined })
    parserWarnings.push(...doc.warnings)
    const lines = parsedRecordsToBudgetLines(doc.records, "word")
    if (lines.length === 0) {
      parserWarnings.push(
        "Word document yielded no structured budget lines. Add lines manually on the review screen.",
      )
    }
    return { sourceType: "word", lines, parserWarnings }
  }

  return { sourceType: "unknown", lines: [], parserWarnings }
}
