import type { SupabaseClient } from "@supabase/supabase-js"
import type { ExpectedBillable } from "../post-award-ledger/types"

export type LoadExpectedBillablesParams = {
  siteId: string
  studyKey: string
}

/** Published baseline rows only (not copies linked to a specific event_log row). */
export async function loadExpectedBillablesFromDb(
  supabase: SupabaseClient,
  params: LoadExpectedBillablesParams,
): Promise<ExpectedBillable[]> {
  const siteId = params.siteId.trim()
  const studyKey = params.studyKey.trim()
  if (!siteId || !studyKey) return []

  const { data, error } = await supabase
    .from("expected_billables")
    .select(
      "id, study_id, study_key, budget_line_id, line_code, label, category, visit_name, unit, expected_quantity, unit_price, expected_revenue, event_log_id",
    )
    .eq("site_id", siteId)
    .eq("study_key", studyKey)
    .is("event_log_id", null)

  if (error) {
    throw new Error(`Failed to load expected_billables: ${error.message}`)
  }

  return (data ?? []).map((r) => {
    const row = r as Record<string, unknown>
    const id = String(row.id ?? "")
    const lineCode = String(row.line_code ?? "")
    const budgetLineId = String(row.budget_line_id ?? id)
    const sk = String(row.study_key ?? row.study_id ?? studyKey)
    return {
      id: id || `${lineCode}-${budgetLineId}`,
      budgetLineId,
      studyId: sk,
      lineCode,
      label: String(row.label ?? lineCode),
      category: String(row.category ?? ""),
      visitName: String(row.visit_name ?? "N/A"),
      unit: String(row.unit ?? "flat"),
      expectedQuantity: Number(row.expected_quantity ?? 1) || 1,
      unitPrice: Number(row.unit_price ?? 0) || 0,
      expectedRevenue: Number(row.expected_revenue ?? 0) || 0,
    } satisfies ExpectedBillable
  })
}
