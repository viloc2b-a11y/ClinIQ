/**
 * Map Document Engine records → canonical ParsedBudgetLine for import review.
 */

import type { ParsedBudgetLine, ParsedBudgetLineConfidence } from "./parsed-budget-line"
import type {
  BudgetLineRecord,
  ParsedDocumentRecord,
  ParsedField,
  ParsedFieldConfidence,
  SoaActivityRecord,
} from "@/lib/document-ingestion/types"

function aggregateConfidence(
  parts: ParsedFieldConfidence[],
): ParsedBudgetLineConfidence {
  if (parts.length === 0) return "medium"
  if (parts.includes("low") || parts.includes("unverified")) return "low"
  if (parts.includes("medium")) return "medium"
  return "high"
}

function numField(f: ParsedField<number | null> | undefined): {
  value: number | null
  conf: ParsedFieldConfidence
} {
  if (!f) return { value: null, conf: "unverified" }
  return { value: f.value, conf: f.confidence }
}

function budgetRecordToLine(
  r: BudgetLineRecord,
  sourceType: ParsedBudgetLine["sourceType"],
): ParsedBudgetLine {
  const qty = numField(r.expectedQuantity)
  const up = numField(r.unitPrice)
  const tot = numField(r.expectedAmount)
  const conf = aggregateConfidence([qty.conf, up.conf, tot.conf])

  const warnings: string[] = []
  if (qty.value === null && tot.value === null) {
    warnings.push("Missing quantity and total; review amounts.")
  }

  return {
    lineId: r.recordId,
    sourceType,
    category: r.category ?? null,
    itemDescription: (r.label ?? "").trim() || "(no description)",
    unitType: r.unit ?? null,
    quantity: qty.value,
    unitPrice: up.value,
    totalPrice: tot.value,
    visitName: r.visitName ?? null,
    notes: r.notes ?? null,
    confidence: conf,
    warnings,
    rawSourceRef: r.provenance?.sheetName
      ? `sheet:${r.provenance.sheetName}:row:${r.provenance.rowIndex1Based ?? "?"}`
      : r.provenance?.page1Based != null
        ? `page:${r.provenance.page1Based}`
        : undefined,
  }
}

function soaRecordToLine(
  r: SoaActivityRecord,
  sourceType: ParsedBudgetLine["sourceType"],
): ParsedBudgetLine {
  const q = numField(r.quantity)
  const ua = numField(r.unitAmount)
  const tot =
    q.value != null && ua.value != null ? q.value * ua.value : ua.value
  const conf = aggregateConfidence([q.conf, ua.conf])

  return {
    lineId: r.recordId,
    sourceType,
    category: null,
    itemDescription: (r.activityLabel ?? r.activityCode ?? "Activity").trim(),
    unitType: r.unit ?? null,
    quantity: q.value,
    unitPrice: ua.value,
    totalPrice: tot,
    visitName: r.visitName ?? null,
    notes: null,
    confidence: conf,
    warnings: ["Derived from schedule/activity row; verify as budget line."],
    rawSourceRef:
      r.provenance?.rowIndex1Based != null
        ? `row:${r.provenance.rowIndex1Based}`
        : undefined,
  }
}

/**
 * Convert parser output records into editable import lines.
 */
export function parsedRecordsToBudgetLines(
  records: ParsedDocumentRecord[],
  sourceType: ParsedBudgetLine["sourceType"],
): ParsedBudgetLine[] {
  const out: ParsedBudgetLine[] = []
  for (const rec of records) {
    if (rec.kind === "budget_line") {
      out.push(budgetRecordToLine(rec, sourceType))
    } else if (rec.kind === "soa_activity") {
      out.push(soaRecordToLine(rec, sourceType))
    }
  }
  return out
}
