/**
 * Document Engine v1 — deterministic translation from canonical {@link ParsedDocument} records
 * to downstream candidate DTOs (no financial engine, persistence, or UI).
 */

import type {
  BudgetLineRecord,
  ContractClauseRecord,
  InvoiceLineRecord,
  ParsedDocument,
  ParsedDocumentRecord,
  ParsedField,
  ParsedFieldConfidence,
  SoaActivityRecord,
  VisitScheduleRecord,
} from "./types"

export type SoaCandidateRow = {
  sourceRecordIndex: number
  visitName: string | null
  activityName: string | null
  quantity: number | null
  unitPrice: number | null
  totalPrice: number | null
  notes: string | null
  confidence: string | null
}

export type BudgetCandidateRow = {
  sourceRecordIndex: number
  activityName: string | null
  quantity: number | null
  unitPrice: number | null
  totalPrice: number | null
  notes: string | null
  confidence: string | null
}

export type InvoiceCandidateRow = {
  sourceRecordIndex: number
  visitName: string | null
  activityName: string | null
  quantity: number | null
  unitPrice: number | null
  totalPrice: number | null
  notes: string | null
  confidence: string | null
}

export type ContractCandidateRow = {
  sourceRecordIndex: number
  clauseText: string | null
  notes: string | null
  confidence: string | null
}

export type VisitScheduleCandidateRow = {
  sourceRecordIndex: number
  visitName: string | null
  notes: string | null
  confidence: string | null
}

export type BridgeDocumentRecordsSummary = {
  totalInputRecords: number
  totalMappedCandidates: number
  unmappedRecords: number
  byInputType: Record<string, number>
  byOutputBucket: Record<string, number>
}

export type BridgeDocumentRecordsResult = {
  soaCandidates: SoaCandidateRow[]
  budgetCandidates: BudgetCandidateRow[]
  invoiceCandidates: InvoiceCandidateRow[]
  contractCandidates: ContractCandidateRow[]
  visitScheduleCandidates: VisitScheduleCandidateRow[]
  warnings: string[]
  summary: BridgeDocumentRecordsSummary
}

const CONF_RANK: Record<ParsedFieldConfidence, number> = {
  low: 0,
  medium: 1,
  unverified: 2,
  high: 3,
}

function worstConfidence(fields: (ParsedField<unknown> | undefined)[]): string | null {
  let worst: ParsedFieldConfidence | null = null
  for (const f of fields) {
    if (f === undefined) continue
    if (worst === null || CONF_RANK[f.confidence] < CONF_RANK[worst]) {
      worst = f.confidence
    }
  }
  return worst
}

function soaTotalPrice(q: number | null, unit: number | null): number | null {
  if (q !== null && unit !== null && Number.isFinite(q) && Number.isFinite(unit)) {
    return q * unit
  }
  return null
}

export function getRecordType(record: ParsedDocumentRecord): string {
  return record.kind
}

export function mapRecordToSoaCandidate(record: SoaActivityRecord, sourceRecordIndex: number): SoaCandidateRow {
  const q = record.quantity?.value ?? null
  const u = record.unitAmount?.value ?? null
  return {
    sourceRecordIndex,
    visitName: record.visitName ?? null,
    activityName: record.activityLabel ?? null,
    quantity: q,
    unitPrice: u,
    totalPrice: soaTotalPrice(q, u),
    notes: null,
    confidence: worstConfidence([record.quantity, record.unitAmount]),
  }
}

export function mapRecordToBudgetCandidate(record: BudgetLineRecord, sourceRecordIndex: number): BudgetCandidateRow {
  return {
    sourceRecordIndex,
    activityName: record.label ?? null,
    quantity: record.expectedQuantity?.value ?? null,
    unitPrice: record.unitPrice?.value ?? null,
    totalPrice: record.expectedAmount?.value ?? null,
    notes: record.notes ?? null,
    confidence: worstConfidence([record.expectedQuantity, record.unitPrice, record.expectedAmount]),
  }
}

export function mapRecordToInvoiceCandidate(record: InvoiceLineRecord, sourceRecordIndex: number): InvoiceCandidateRow {
  const activity = record.description ?? record.lineCode ?? null
  return {
    sourceRecordIndex,
    visitName: null,
    activityName: activity,
    quantity: record.quantity?.value ?? null,
    unitPrice: record.unitPrice?.value ?? null,
    totalPrice: record.lineAmount?.value ?? null,
    notes: null,
    confidence: worstConfidence([record.quantity, record.unitPrice, record.lineAmount, record.taxAmount]),
  }
}

export function mapRecordToContractCandidate(
  record: ContractClauseRecord,
  sourceRecordIndex: number,
): ContractCandidateRow {
  const excerptTrim = record.excerpt?.trim() ?? ""
  const clauseText = excerptTrim.length > 0 ? record.excerpt : record.title ?? null
  const supplemental = [record.title, record.sectionReference].filter(Boolean).join(" — ") || null
  return {
    sourceRecordIndex,
    clauseText,
    notes: supplemental,
    confidence: worstConfidence([record.booleanValue]),
  }
}

export function mapRecordToVisitScheduleCandidate(
  record: VisitScheduleRecord,
  sourceRecordIndex: number,
): VisitScheduleCandidateRow {
  return {
    sourceRecordIndex,
    visitName: record.visitName ?? null,
    notes: record.notes ?? null,
    confidence: worstConfidence([
      record.visitNumber,
      record.targetStudyDay,
      record.windowStartDay,
      record.windowEndDay,
    ]),
  }
}

export function buildSummary(params: {
  records: ParsedDocumentRecord[]
  soaCandidates: SoaCandidateRow[]
  budgetCandidates: BudgetCandidateRow[]
  invoiceCandidates: InvoiceCandidateRow[]
  contractCandidates: ContractCandidateRow[]
  visitScheduleCandidates: VisitScheduleCandidateRow[]
  unmappedRecords: number
}): BridgeDocumentRecordsSummary {
  const { records, unmappedRecords } = params
  const kindCounts = new Map<string, number>()
  for (const r of records) {
    kindCounts.set(r.kind, (kindCounts.get(r.kind) ?? 0) + 1)
  }
  const inputKinds = [...kindCounts.keys()].sort((a, b) => a.localeCompare(b))
  const byInputType: Record<string, number> = {}
  for (const k of inputKinds) {
    byInputType[k] = kindCounts.get(k) ?? 0
  }

  const bucketSizes: Record<string, number> = {
    budgetCandidates: params.budgetCandidates.length,
    contractCandidates: params.contractCandidates.length,
    invoiceCandidates: params.invoiceCandidates.length,
    soaCandidates: params.soaCandidates.length,
    visitScheduleCandidates: params.visitScheduleCandidates.length,
  }
  const bucketKeys = Object.keys(bucketSizes).sort((a, b) => a.localeCompare(b))
  const byOutputBucket: Record<string, number> = {}
  for (const k of bucketKeys) {
    byOutputBucket[k] = bucketSizes[k]!
  }

  const totalMappedCandidates =
    params.soaCandidates.length +
    params.budgetCandidates.length +
    params.invoiceCandidates.length +
    params.contractCandidates.length +
    params.visitScheduleCandidates.length

  return {
    totalInputRecords: records.length,
    totalMappedCandidates,
    unmappedRecords,
    byInputType,
    byOutputBucket,
  }
}

const UNMAPPED_AGGREGATE_WARNING =
  "Some document records could not be mapped to candidate buckets."

/**
 * Map each canonical record into a single downstream candidate bucket by `kind`.
 * `documentId` is accepted for future tracing; it does not change output shape today.
 */
export function bridgeDocumentRecords(input: {
  documentId?: string
  parsedDocument: ParsedDocument
}): BridgeDocumentRecordsResult {
  const { parsedDocument } = input
  const records = parsedDocument.records
  const warnings = [...parsedDocument.warnings]

  const soaCandidates: SoaCandidateRow[] = []
  const budgetCandidates: BudgetCandidateRow[] = []
  const invoiceCandidates: InvoiceCandidateRow[] = []
  const contractCandidates: ContractCandidateRow[] = []
  const visitScheduleCandidates: VisitScheduleCandidateRow[] = []
  let unmappedRecords = 0

  for (let i = 0; i < records.length; i++) {
    const record = records[i]!
    switch (record.kind) {
      case "soa_activity":
        soaCandidates.push(mapRecordToSoaCandidate(record, i))
        break
      case "budget_line":
        budgetCandidates.push(mapRecordToBudgetCandidate(record, i))
        break
      case "invoice_line":
        invoiceCandidates.push(mapRecordToInvoiceCandidate(record, i))
        break
      case "contract_clause":
        contractCandidates.push(mapRecordToContractCandidate(record, i))
        break
      case "visit_schedule":
        visitScheduleCandidates.push(mapRecordToVisitScheduleCandidate(record, i))
        break
      default: {
        unmappedRecords += 1
        break
      }
    }
  }

  if (unmappedRecords > 0 && !warnings.includes(UNMAPPED_AGGREGATE_WARNING)) {
    warnings.push(UNMAPPED_AGGREGATE_WARNING)
  }

  const summary = buildSummary({
    records,
    soaCandidates,
    budgetCandidates,
    invoiceCandidates,
    contractCandidates,
    visitScheduleCandidates,
    unmappedRecords,
  })

  return {
    soaCandidates,
    budgetCandidates,
    invoiceCandidates,
    contractCandidates,
    visitScheduleCandidates,
    warnings,
    summary,
  }
}
