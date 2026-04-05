import type { DocumentSourceType } from "./types"

export type ClassifyDocumentInput = {
  fileName: string
  mimeType?: string
}

/** Same as {@link DocumentSourceType} (includes `unknown`). */
export type ClassifiedSourceType = DocumentSourceType

export type ClassifyDocumentResult = {
  sourceType: ClassifiedSourceType
  confidence: number
  warnings: string[]
}

const EXCEL_EXTENSIONS = new Set(["xlsx", "xls"])
const PDF_EXTENSIONS = new Set(["pdf"])
const WORD_EXTENSIONS = new Set(["docx", "doc"])

/** Common MIME types only; unknown strings fall through to `unknown`. */
const MIME_TO_SOURCE: Readonly<Record<string, DocumentSourceType>> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "excel",
  "application/vnd.ms-excel": "excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "word",
  "application/msword": "word",
}

const CONF = {
  extensionMatch: 1,
  extensionMismatchMime: 0.65,
  mimeOnly: 0.85,
  unknown: 0.15,
} as const

function normalizeMime(mimeType: string | undefined): string | null {
  if (mimeType == null || mimeType.trim() === "") return null
  return mimeType.split(";")[0].trim().toLowerCase()
}

function sourceFromMime(mimeType: string | undefined): ClassifiedSourceType {
  const m = normalizeMime(mimeType)
  if (!m) return "unknown"
  return MIME_TO_SOURCE[m] ?? "unknown"
}

function extensionFromFileName(fileName: string): string | null {
  const segment = fileName.replace(/\\/g, "/").split("/").pop() ?? ""
  const dot = segment.lastIndexOf(".")
  if (dot <= 0 || dot === segment.length - 1) return null
  return segment.slice(dot + 1).toLowerCase()
}

function sourceFromExtension(ext: string): ClassifiedSourceType {
  if (EXCEL_EXTENSIONS.has(ext)) return "excel"
  if (PDF_EXTENSIONS.has(ext)) return "pdf"
  if (WORD_EXTENSIONS.has(ext)) return "word"
  return "unknown"
}

/**
 * Detect document format from file name (extension first) and optional MIME type.
 * Deterministic; no I/O.
 */
export function classifyDocument(input: ClassifyDocumentInput): ClassifyDocumentResult {
  const warnings: string[] = []
  const ext = extensionFromFileName(input.fileName)
  const fromExt = ext != null ? sourceFromExtension(ext) : "unknown"

  if (fromExt !== "unknown") {
    const fromMime = sourceFromMime(input.mimeType)
    if (fromMime !== "unknown" && fromMime !== fromExt) {
      warnings.push(
        `mime_type_mismatch: extension indicates ${fromExt} but mimeType indicates ${fromMime}`,
      )
      return {
        sourceType: fromExt,
        confidence: CONF.extensionMismatchMime,
        warnings,
      }
    }
    return { sourceType: fromExt, confidence: CONF.extensionMatch, warnings }
  }

  if (ext === null) {
    warnings.push("no_file_extension")
  } else {
    warnings.push(`unrecognized_file_extension: .${ext}`)
  }

  const fromMime = sourceFromMime(input.mimeType)
  if (fromMime !== "unknown") {
    return {
      sourceType: fromMime,
      confidence: CONF.mimeOnly,
      warnings,
    }
  }

  if (normalizeMime(input.mimeType) != null && fromMime === "unknown") {
    warnings.push("unrecognized_mime_type")
  }

  warnings.push("could_not_classify_document_source")
  return { sourceType: "unknown", confidence: CONF.unknown, warnings }
}
