/**
 * Module 2 — unified sponsor-offer ingestion facade (rows, record, xlsx, pdf).
 * Dispatches only; no extra business rules.
 */

import type { FeeFamily, SiteCostModelOutput } from "../cost-model/cost-model-types"
import {
  buildModule2NegotiationReviewFromOfferRecord,
  buildModule2NegotiationReviewFromOfferRows,
} from "./build-module2-negotiation-review-from-raw-offer"
import type { Module2NegotiationReview } from "./build-module2-negotiation-review"
import type {
  IngestSponsorOfferPdfParams,
  ParsedPdfSponsorOfferRow,
} from "./ingest-sponsor-offer-pdf"
import type { IngestSponsorOfferXlsxParams } from "./ingest-sponsor-offer-xlsx"
import type { ParsedExcelSponsorOfferRow } from "./ingest-sponsor-offer-xlsx"
import type { RawSponsorOfferRow } from "./normalize-sponsor-offer-input"

type IngestSponsorOfferBase = {
  costOutput: SiteCostModelOutput
  projectedRevenue: number
  feeNotesByFeeFamily?: Partial<Record<FeeFamily, string>>
  studyId?: string
  siteId?: string
}

export type IngestSponsorOfferParams =
  | (IngestSponsorOfferBase & {
      sourceType: "rows"
      rows: RawSponsorOfferRow[]
    })
  | (IngestSponsorOfferBase & {
      sourceType: "record"
      record: Record<string, number | null | undefined>
    })
  | (IngestSponsorOfferXlsxParams & { sourceType: "xlsx" })
  | (IngestSponsorOfferPdfParams & { sourceType: "pdf" })

export interface IngestSponsorOfferResult {
  sourceType: "rows" | "record" | "xlsx" | "pdf"
  normalizedOffers: Partial<Record<FeeFamily, number | null>>
  warnings: string[]
  unmatched: Array<{
    rawKey: string
    amount: number | null
  }>
  review: Module2NegotiationReview
  parsedRows?: Array<{
    key: string
    amount: number | null
    source?: Record<string, unknown>
  }>
}

function mapExcelParsedRows(
  rows: ParsedExcelSponsorOfferRow[],
): NonNullable<IngestSponsorOfferResult["parsedRows"]> {
  return rows.map((row) => ({
    key: row.key,
    amount: row.amount,
    source: {
      sheet: row.source.sheet,
      rowIndex: row.source.rowIndex,
    },
  }))
}

function mapPdfParsedRows(
  rows: ParsedPdfSponsorOfferRow[],
): NonNullable<IngestSponsorOfferResult["parsedRows"]> {
  return rows.map((row) => ({
    key: row.key,
    amount: row.amount,
    source: {
      page: row.source.page,
      ...(row.source.line !== undefined ? { line: row.source.line } : {}),
    },
  }))
}

export async function ingestSponsorOffer(
  params: IngestSponsorOfferParams,
): Promise<IngestSponsorOfferResult> {
  switch (params.sourceType) {
    case "rows": {
      const { sourceType, rows, ...base } = params
      const r = buildModule2NegotiationReviewFromOfferRows({
        ...base,
        rawSponsorOfferRows: rows,
      })
      return {
        sourceType: "rows",
        normalizedOffers: r.normalizedOffers,
        warnings: r.warnings,
        unmatched: r.unmatched,
        review: r.review,
      }
    }
    case "record": {
      const { sourceType, record, ...base } = params
      const r = buildModule2NegotiationReviewFromOfferRecord({
        ...base,
        rawSponsorOfferRecord: record,
      })
      return {
        sourceType: "record",
        normalizedOffers: r.normalizedOffers,
        warnings: r.warnings,
        unmatched: r.unmatched,
        review: r.review,
      }
    }
    case "xlsx": {
      const { sourceType, ...xlsxParams } = params
      const { ingestSponsorOfferXlsx } = await import("./ingest-sponsor-offer-xlsx")
      const r = ingestSponsorOfferXlsx(xlsxParams)
      return {
        sourceType: "xlsx",
        normalizedOffers: r.normalizedOffers,
        warnings: r.warnings,
        unmatched: r.unmatched,
        review: r.review,
        parsedRows: mapExcelParsedRows(r.parsedRows),
      }
    }
    case "pdf": {
      const { sourceType, ...pdfParams } = params
      const { ingestSponsorOfferPdf } = await import("./ingest-sponsor-offer-pdf")
      const r = await ingestSponsorOfferPdf(pdfParams)
      return {
        sourceType: "pdf",
        normalizedOffers: r.normalizedOffers,
        warnings: r.warnings,
        unmatched: r.unmatched,
        review: r.review,
        parsedRows: mapPdfParsedRows(r.parsedRows),
      }
    }
    default: {
      throw new Error("ingestSponsorOffer: unsupported sourceType")
    }
  }
}
