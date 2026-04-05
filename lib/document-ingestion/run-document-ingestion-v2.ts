import { classifyDocument } from "./classify-document"
import { runExcelCanonicalIngestion } from "./excel-hardening/run-excel-canonical-ingestion"

function mapClassificationWarnings(warnings: string[]) {
  return warnings.map((message) => ({
    code: "classify_document",
    message,
    severity: "warning" as const,
  }))
}

export function runDocumentIngestionV2(params: {
  fileName?: string
  mimeType?: string | null
  workbook?: Record<string, unknown>
  pdfPages?: Array<{ text?: string | null }>
  wordParagraphs?: string[]
}) {
  const classification = classifyDocument({
    fileName: params.fileName ?? "",
    mimeType: params.mimeType ?? undefined,
  })

  const sourceType = classification.sourceType

  if (sourceType === "excel" && params.workbook) {
    const excel = runExcelCanonicalIngestion({
      workbook: params.workbook,
      fileName: params.fileName,
    })

    return {
      data: {
        sourceType,
        route: "excel_hardened" as const,
        parsedDocument: {
          sourceType: "excel" as const,
          fileName: params.fileName ?? null,
          records: excel.data.canonicalRecords,
        },
        excel,
      },
      summary: {
        status: excel.summary.status,
        sourceType,
        route: "excel_hardened" as const,
        totalRecords: excel.summary.canonicalRecordsCount,
      },
      warnings: [...mapClassificationWarnings(classification.warnings), ...excel.warnings],
    }
  }

  if (sourceType === "excel" && !params.workbook) {
    return {
      data: {
        sourceType,
        route: "legacy" as const,
        parsedDocument: null,
        excel: null,
      },
      summary: {
        status: "partial" as const,
        sourceType,
        route: "legacy" as const,
        totalRecords: 0,
      },
      warnings: [
        ...mapClassificationWarnings(classification.warnings),
        {
          code: "excel_workbook_missing",
          message:
            "Excel source was classified but no workbook grid was provided; hardened path was not run",
          severity: "warning" as const,
        },
        {
          code: "legacy_document_route",
          message:
            "Document was routed through the legacy/non-hardened path because hardened integration is only enabled for Excel in this step",
          severity: "info" as const,
        },
      ],
    }
  }

  return {
    data: {
      sourceType,
      route: "legacy" as const,
      parsedDocument: null,
      excel: null,
    },
    summary: {
      status: "partial" as const,
      sourceType,
      route: "legacy" as const,
      totalRecords: 0,
    },
    warnings: [
      ...mapClassificationWarnings(classification.warnings),
      {
        code: "legacy_document_route",
        message:
          "Document was routed through the legacy/non-hardened path because hardened integration is only enabled for Excel in this step",
        severity: "info" as const,
      },
    ],
  }
}
