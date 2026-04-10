/**
 * Maps draft / negotiation shapes into public.expected_billables (existing schema only).
 */

import type { InternalBudgetLine, SponsorBudgetLine } from "@/lib/cliniq-core/budget-gap/types"

export type ExpectedBillableInsertRow = {
  study_id: string
  site_id: string
  study_key: string
  budget_line_id: string
  line_code: string
  label: string
  category: string
  visit_name: string
  unit: string
  expected_quantity: number
  unit_price: number
  expected_revenue: number
  event_log_id: null
  subject_id: null
}

export type NegotiationItemRow = {
  source_line_id: string
  line_code: string
  label: string
  category: string
  visit_name: string
  quantity: number | string | null
  unit: string | null
  proposed_price: number | string | null
  current_price: number | string | null
  status: string | null
}

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? n : fallback
}

function ctxBase(siteId: string, studyKey: string): Pick<ExpectedBillableInsertRow, "study_id" | "site_id" | "study_key"> {
  const sk = studyKey.trim() || "STUDY-1"
  return { site_id: siteId, study_key: sk, study_id: sk }
}

export function mapInternalLinesToExpectedBillableRows(
  lines: InternalBudgetLine[],
  siteId: string,
  studyKey: string,
): ExpectedBillableInsertRow[] {
  const base = ctxBase(siteId, studyKey)
  return lines.map((l) => {
    const qty = Math.max(num(l.quantity, 1), 0.0001)
    const total = num(l.internalTotal, 0)
    const unitPrice = qty !== 0 ? total / qty : total
    return {
      ...base,
      budget_line_id: l.id,
      line_code: l.lineCode,
      label: l.label,
      category: l.category || "",
      visit_name: l.visitName || "N/A",
      unit: (l.unit || "flat").trim() || "flat",
      expected_quantity: qty,
      unit_price: unitPrice,
      expected_revenue: total,
      event_log_id: null,
      subject_id: null,
    }
  })
}

export function mapSponsorLinesToExpectedBillableRows(
  lines: SponsorBudgetLine[],
  siteId: string,
  studyKey: string,
): ExpectedBillableInsertRow[] {
  const base = ctxBase(siteId, studyKey)
  return lines.map((l) => {
    const qty = Math.max(num(l.quantity, 1), 0.0001)
    const total = num(l.sponsorTotalOffer, 0)
    const unitPrice = qty !== 0 ? total / qty : total
    return {
      ...base,
      budget_line_id: l.id,
      line_code: l.lineCode,
      label: l.label,
      category: l.category || "",
      visit_name: l.visitName || "N/A",
      unit: (l.unit || "flat").trim() || "flat",
      expected_quantity: qty,
      unit_price: unitPrice,
      expected_revenue: total,
      event_log_id: null,
      subject_id: null,
    }
  })
}

export function mapNegotiationItemsToExpectedBillableRows(
  items: NegotiationItemRow[],
  siteId: string,
  studyKey: string,
): ExpectedBillableInsertRow[] {
  const base = ctxBase(siteId, studyKey)
  const out: ExpectedBillableInsertRow[] = []
  for (const it of items) {
    if (it.status === "rejected") continue
    const qty = Math.max(num(it.quantity, 1), 0.0001)
    const proposed = num(it.proposed_price, 0)
    const current = num(it.current_price, 0)
    const total = proposed > 0 ? proposed : current
    const unitPrice = qty !== 0 ? total / qty : total
    const sid = String(it.source_line_id ?? "").trim()
    if (!sid) continue
    out.push({
      ...base,
      budget_line_id: sid,
      line_code: String(it.line_code ?? "").trim() || sid,
      label: String(it.label ?? "").trim() || sid,
      category: String(it.category ?? "").trim(),
      visit_name: String(it.visit_name ?? "").trim() || "N/A",
      unit: String(it.unit ?? "flat").trim() || "flat",
      expected_quantity: qty,
      unit_price: unitPrice,
      expected_revenue: total,
      event_log_id: null,
      subject_id: null,
    })
  }
  return out
}

export function expectedBillableRowsFromDraftPayload(args: {
  siteId: string
  studyKey: string
  internal_lines: unknown
  sponsor_lines: unknown
}): ExpectedBillableInsertRow[] {
  const internal = Array.isArray(args.internal_lines) ? (args.internal_lines as InternalBudgetLine[]) : []
  const sponsor = Array.isArray(args.sponsor_lines) ? (args.sponsor_lines as SponsorBudgetLine[]) : []
  if (internal.length > 0) return mapInternalLinesToExpectedBillableRows(internal, args.siteId, args.studyKey)
  if (sponsor.length > 0) return mapSponsorLinesToExpectedBillableRows(sponsor, args.siteId, args.studyKey)
  return []
}
