/**
 * Map reviewed ParsedBudgetLine[] into Budget Gap compare inputs by import intent.
 */

import type { ImportIntent, ParsedBudgetLine } from "./parsed-budget-line"
import type {
  InternalBudgetLine,
  SponsorBudgetLine,
} from "@/lib/cliniq-core/budget-gap/types"

function lineCodeFromId(lineId: string, index: number): string {
  const short = lineId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12)
  if (short.length >= 4) return `IMP-${short}`
  return `IMP-${String(index + 1).padStart(3, "0")}`
}

function toInternalLine(
  line: ParsedBudgetLine,
  index: number,
): InternalBudgetLine {
  const qty = line.quantity ?? 1
  let unitCost = line.unitPrice
  let total = line.totalPrice
  if (unitCost == null && total != null && qty !== 0) unitCost = total / qty
  if (total == null && unitCost != null) total = unitCost * qty
  unitCost = unitCost ?? 0
  total = total ?? 0

  return {
    id: `int-import-${line.lineId}`,
    category: line.category ?? "Imported",
    lineCode: lineCodeFromId(line.lineId, index),
    label: line.itemDescription,
    visitName: line.visitName ?? "N/A",
    quantity: qty,
    unit: line.unitType?.trim() || "unit",
    internalUnitCost: unitCost,
    internalTotal: total,
    notes: [line.notes, line.warnings.length ? line.warnings.join("; ") : ""]
      .filter(Boolean)
      .join(" — "),
    source: "internal-model",
  }
}

function toSponsorLine(
  line: ParsedBudgetLine,
  index: number,
): SponsorBudgetLine {
  const qty = line.quantity ?? 1
  let unit = line.unitPrice
  let total = line.totalPrice
  if (unit == null && total != null && qty !== 0) unit = total / qty
  if (total == null && unit != null) total = unit * qty
  unit = unit ?? 0
  total = total ?? 0

  return {
    id: `sp-import-${line.lineId}`,
    category: line.category ?? "Imported",
    lineCode: lineCodeFromId(line.lineId, index),
    label: line.itemDescription,
    visitName: line.visitName ?? "N/A",
    quantity: qty,
    unit: line.unitType?.trim() || "unit",
    sponsorUnitOffer: unit,
    sponsorTotalOffer: total,
    notes: [line.notes, line.warnings.length ? line.warnings.join("; ") : ""]
      .filter(Boolean)
      .join(" — "),
    source: "sponsor-budget",
  }
}

/**
 * Active lines only (excluded filtered out by caller).
 * - sponsor_budget → sponsorLines only
 * - site_internal_budget → internalLines only
 * - contract_financial → internalLines (site-side extraction; sponsor added separately)
 */
export function mapParsedLinesToBudgetGapInput(
  lines: ParsedBudgetLine[],
  intent: ImportIntent,
): { internalLines: InternalBudgetLine[]; sponsorLines: SponsorBudgetLine[] } {
  const internalLines: InternalBudgetLine[] = []
  const sponsorLines: SponsorBudgetLine[] = []

  lines.forEach((line, index) => {
    if (intent === "sponsor_budget") {
      sponsorLines.push(toSponsorLine(line, index))
    } else if (intent === "site_internal_budget") {
      internalLines.push(toInternalLine(line, index))
    } else {
      internalLines.push(toInternalLine(line, index))
    }
  })

  return { internalLines, sponsorLines }
}
