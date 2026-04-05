/**
 * Document Engine v1 — map pre-extracted Excel rows to canonical ParsedDocument records.
 * No binary .xlsx I/O; deterministic header heuristics only.
 */

import {
  cleanString,
  normalizeCurrency,
  normalizeNumber,
  normalizeVisitName,
} from "../normalize-records"
import type {
  BudgetLineRecord,
  ParsedDocument,
  ParsedDocumentRecord,
  ParsedField,
  ParsedFieldConfidence,
  SoaActivityRecord,
} from "../types"
import { PARSED_DOCUMENT_SCHEMA_VERSION } from "../types"

export type ParseExcelInput = {
  fileName?: string
  sheetName?: string
  rows: Record<string, unknown>[]
}

const PARSER_ID = "cliniq-parse-excel-v1"

type ColumnRole =
  | "visit"
  | "activity"
  | "quantity"
  | "unitPrice"
  | "total"
  | "notes"

type ColumnMap = Partial<Record<ColumnRole, string>>

const ALIASES: Readonly<Record<ColumnRole, readonly string[]>> = {
  visit: ["visit", "visitname", "visit_name", "encounter", "timepoint"],
  activity: [
    "activity",
    "procedure",
    "item",
    "description",
    "proceduredescription",
    "procedure_description",
    "event",
    "assessment",
  ],
  quantity: ["qty", "quantity", "units", "count"],
  unitPrice: ["unitprice", "unit_price", "rate", "fee", "cost", "price"],
  total: ["total", "amount", "totalfee", "total_fee", "linetotal", "line_total", "extendedamount", "extended_amount"],
  notes: ["notes", "comment", "comments", "remark", "remarks"],
}

const ALIAS_NORMALIZED: Readonly<Record<ColumnRole, ReadonlySet<string>>> = {
  visit: new Set(ALIASES.visit.map(normalizeHeaderKey)),
  activity: new Set(ALIASES.activity.map(normalizeHeaderKey)),
  quantity: new Set(ALIASES.quantity.map(normalizeHeaderKey)),
  unitPrice: new Set(ALIASES.unitPrice.map(normalizeHeaderKey)),
  total: new Set(ALIASES.total.map(normalizeHeaderKey)),
  notes: new Set(ALIASES.notes.map(normalizeHeaderKey)),
}

/** Normalize header labels for case/spacing/underscore/hyphen insensitive matching. */
export function normalizeHeaderKey(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "")
}

function sortedUniqueKeys(rows: Record<string, unknown>[]): string[] {
  const set = new Set<string>()
  for (const row of rows) {
    for (const k of Object.keys(row)) {
      set.add(k)
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b))
}

export function detectColumnMap(rows: Record<string, unknown>[]): ColumnMap {
  const map: ColumnMap = {}
  const keys = sortedUniqueKeys(rows)
  const roles: ColumnRole[] = [
    "visit",
    "activity",
    "quantity",
    "unitPrice",
    "total",
    "notes",
  ]

  for (const role of roles) {
    const aliasSet = ALIAS_NORMALIZED[role]
    for (const key of keys) {
      const nk = normalizeHeaderKey(key)
      if (aliasSet.has(nk)) {
        map[role] = key
        break
      }
    }
  }
  return map
}

export function isEmptyRow(row: Record<string, unknown>): boolean {
  const vals = Object.values(row)
  if (vals.length === 0) return true
  for (const v of vals) {
    const s = cleanString(v)
    if (s !== null) return false
    if (typeof v === "number" && Number.isFinite(v)) return false
  }
  return true
}

function djb2Hex(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i)
  }
  return (h >>> 0).toString(16).padStart(8, "0")
}

function recordIdFor(params: {
  sheetName?: string
  rowIndex1Based: number
  kind: "soa_activity" | "budget_line"
  dedupeKey: string
}): string {
  const sheet = params.sheetName ?? "default"
  return `excel-v1:${encodeURIComponent(sheet)}:${params.rowIndex1Based}:${params.kind}:${djb2Hex(params.dedupeKey)}`
}

function parseMoneyRaw(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null
  if (typeof raw === "string") {
    const s = raw.trim()
    if (s === "") return null
    return normalizeCurrency(s)
  }
  return null
}

function parseQuantityRaw(raw: unknown): number | null {
  return normalizeNumber(raw)
}

function parsedMoneyField(
  raw: unknown,
  columnMapped: boolean,
): { field: ParsedField<number | null>; hadParseError: boolean } {
  if (raw === null || raw === undefined || (typeof raw === "string" && cleanString(raw) === null)) {
    const conf: ParsedFieldConfidence = columnMapped ? "medium" : "unverified"
    return { field: { value: null, confidence: conf }, hadParseError: false }
  }
  const n = parseMoneyRaw(raw)
  if (n !== null) {
    return { field: { value: n, confidence: "high" }, hadParseError: false }
  }
  const hasContent =
    typeof raw === "number"
      ? true
      : typeof raw === "string"
        ? raw.trim() !== ""
        : false
  return {
    field: { value: null, confidence: columnMapped ? "low" : "unverified" },
    hadParseError: columnMapped && hasContent,
  }
}

function parsedQuantityField(
  raw: unknown,
  columnMapped: boolean,
): { field: ParsedField<number | null>; hadParseError: boolean } {
  if (raw === null || raw === undefined || (typeof raw === "string" && cleanString(raw) === null)) {
    const conf: ParsedFieldConfidence = columnMapped ? "medium" : "unverified"
    return { field: { value: null, confidence: conf }, hadParseError: false }
  }
  const n = parseQuantityRaw(raw)
  if (n !== null) {
    return { field: { value: n, confidence: "high" }, hadParseError: false }
  }
  const hasContent =
    typeof raw === "number"
      ? true
      : typeof raw === "string"
        ? raw.trim() !== ""
        : false
  return {
    field: { value: null, confidence: columnMapped ? "low" : "unverified" },
    hadParseError: columnMapped && hasContent,
  }
}

function getRaw(row: Record<string, unknown>, colMap: ColumnMap, role: ColumnRole): unknown {
  const key = colMap[role]
  if (key === undefined) return undefined
  return row[key]
}

function hasPricing(colMap: ColumnMap, row: Record<string, unknown>): boolean {
  const up = getRaw(row, colMap, "unitPrice")
  const tot = getRaw(row, colMap, "total")
  return parseMoneyRaw(up) !== null || parseMoneyRaw(tot) !== null
}

function classifyRow(
  colMap: ColumnMap,
  row: Record<string, unknown>,
): "soa_activity" | "budget_line" | null {
  const visitRaw = getRaw(row, colMap, "visit")
  const visit = normalizeVisitName(visitRaw)
  const actRaw = getRaw(row, colMap, "activity")
  const activity = cleanString(actRaw)

  if (!activity) return null
  if (visit) return "soa_activity"
  if (hasPricing(colMap, row)) return "budget_line"
  /** Visit column present but empty: still SoA-shaped for review (not budget without parseable price). */
  if (colMap.visit !== undefined) return "soa_activity"
  return null
}

function parseRowToRecord(
  input: ParseExcelInput,
  colMap: ColumnMap,
  row: Record<string, unknown>,
  rowIndex1Based: number,
  warnings: string[],
): ParsedDocumentRecord | null {
  const kind = classifyRow(colMap, row)
  if (kind === null) {
    const hasAny = Object.keys(row).length > 0
    if (hasAny && !isEmptyRow(row)) {
      warnings.push(
        `Row ${rowIndex1Based} skipped: need an activity/procedure column; SoA rows also need a visit, budget rows need a unit price or total when visit is absent.`,
      )
    }
    return null
  }

  const visitDisplay = normalizeVisitName(getRaw(row, colMap, "visit"))
  const activityDisplay = cleanString(getRaw(row, colMap, "activity")) ?? ""

  const qtyRaw = getRaw(row, colMap, "quantity")
  const upRaw = getRaw(row, colMap, "unitPrice")
  const totRaw = getRaw(row, colMap, "total")
  const notesRaw = getRaw(row, colMap, "notes")
  const notes = cleanString(notesRaw) ?? undefined

  const qQty = parsedQuantityField(qtyRaw, colMap.quantity !== undefined)
  const qUp = parsedMoneyField(upRaw, colMap.unitPrice !== undefined)
  const qTot = parsedMoneyField(totRaw, colMap.total !== undefined)

  if (qQty.hadParseError) {
    warnings.push(`Row ${rowIndex1Based}: unparseable quantity value.`)
  }
  if (qUp.hadParseError) {
    warnings.push(`Row ${rowIndex1Based}: unparseable unit price or rate value.`)
  }
  if (qTot.hadParseError) {
    warnings.push(`Row ${rowIndex1Based}: unparseable total or amount value.`)
  }

  const columnKeys = Object.keys(row).sort((a, b) => a.localeCompare(b))
  const provenance = {
    sheetName: input.sheetName,
    rowIndex1Based,
    columnKeys,
  }

  if (kind === "soa_activity") {
    let unitAmount = qUp.field
    let quantity = qQty.field
    if (unitAmount.value === null && qTot.field.value !== null && quantity.value !== null && quantity.value !== 0) {
      unitAmount = {
        value: qTot.field.value / quantity.value,
        confidence:
          qTot.field.confidence === "high" && quantity.confidence === "high" ? "medium" : "low",
      }
    } else if (unitAmount.value === null && qTot.field.value !== null && (quantity.value === null || quantity.value === 0)) {
      unitAmount = {
        value: qTot.field.value,
        confidence: qTot.field.confidence === "high" ? "medium" : "low",
      }
      if (quantity.value === null) {
        quantity = { value: 1, confidence: "unverified" }
      }
    }

    const record: SoaActivityRecord = {
      kind: "soa_activity",
      recordId: recordIdFor({
        sheetName: input.sheetName,
        rowIndex1Based,
        kind: "soa_activity",
        dedupeKey: `${visitDisplay ?? ""}\0${activityDisplay}`,
      }),
      provenance,
      visitName: visitDisplay ?? undefined,
      activityLabel: activityDisplay,
      quantity,
      unitAmount,
    }
    return record
  }

  const budget: BudgetLineRecord = {
    kind: "budget_line",
    recordId: recordIdFor({
      sheetName: input.sheetName,
      rowIndex1Based,
      kind: "budget_line",
      dedupeKey: `${activityDisplay}\0${qTot.field.value ?? ""}\0${qUp.field.value ?? ""}`,
    }),
    provenance,
    label: activityDisplay,
    expectedQuantity: qQty.field,
    unitPrice: qUp.field,
    expectedAmount: qTot.field,
    notes,
  }
  return budget
}

function inferDocumentRole(records: ParsedDocumentRecord[]): ParsedDocument["documentRole"] {
  if (records.length === 0) return "unknown"
  const kinds = new Set(records.map((r) => r.kind))
  if (kinds.size === 1) {
    if (kinds.has("soa_activity")) return "soa"
    if (kinds.has("budget_line")) return "budget"
  }
  return "unknown"
}

/**
 * Map flat tabular rows (already extracted from a sheet) into a {@link ParsedDocument}.
 */
export function parseExcel(input: ParseExcelInput): ParsedDocument {
  const warnings: string[] = []
  const rows = input.rows ?? []

  if (rows.length === 0) {
    warnings.push("No rows supplied: nothing to parse.")
    return {
      schemaVersion: PARSED_DOCUMENT_SCHEMA_VERSION,
      sourceType: "excel",
      documentRole: "unknown",
      fileName: input.fileName,
      parsedAt: new Date().toISOString(),
      parserId: PARSER_ID,
      records: [],
      warnings,
    }
  }

  const colMap = detectColumnMap(rows)
  const records: ParsedDocumentRecord[] = []

  let rowIndex1Based = 0
  for (const row of rows) {
    rowIndex1Based += 1
    if (isEmptyRow(row)) {
      warnings.push(`Row ${rowIndex1Based} skipped: empty row.`)
      continue
    }

    const rec = parseRowToRecord(input, colMap, row, rowIndex1Based, warnings)
    if (rec) records.push(rec)
  }

  if (records.length === 0 && rows.length > 0) {
    warnings.push("Document has no recognized data rows after classification rules.")
  }

  return {
    schemaVersion: PARSED_DOCUMENT_SCHEMA_VERSION,
    sourceType: "excel",
    documentRole: inferDocumentRole(records),
    fileName: input.fileName,
    parsedAt: new Date().toISOString(),
    parserId: PARSER_ID,
    records,
    warnings,
  }
}
