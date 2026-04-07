export const dynamic = 'force-dynamic'

import {
  createExecutionSupabaseClient,
  executionSupabaseErrorResponse,
} from "@/lib/execution/service-supabase"

export async function GET(req: Request) {
  const supabase = createExecutionSupabaseClient()
  if (!supabase) return executionSupabaseErrorResponse()

  const { searchParams } = new URL(req.url)
  const studyKey = searchParams.get("study_key")?.trim()

  if (!studyKey) {
    return Response.json({
      ok: true,
      data: {
        study_key: null,
        message: "Pass study_key to load execution summary.",
        counts: null,
        totals: null,
        samples: null,
      },
    })
  }

  const [
    expectedRes,
    eventsRes,
    billablesRes,
    leakageRes,
    invoiceRes,
  ] = await Promise.all([
    supabase.from("expected_billables").select("id", { count: "exact", head: true }).eq("study_id", studyKey),
    supabase.from("event_log").select("id", { count: "exact", head: true }).eq("study_id", studyKey),
    supabase
      .from("billable_instances")
      .select("id", { count: "exact", head: true })
      .eq("execution_study_key", studyKey),
    supabase
      .from("cliniq_action_items")
      .select("id", { count: "exact", head: true })
      .eq("study_id", studyKey)
      .gt("missing_amount", 0),
    supabase.from("invoice_packages").select("id", { count: "exact", head: true }),
  ])

  const errs = [expectedRes.error, eventsRes.error, billablesRes.error, leakageRes.error, invoiceRes.error].filter(
    Boolean,
  )
  if (errs.length > 0) {
    return Response.json({ ok: false, error: errs[0]!.message }, { status: 500 })
  }

  const { data: expSum } = await supabase
    .from("expected_billables")
    .select("expected_revenue")
    .eq("study_id", studyKey)

  const { data: biSum } = await supabase
    .from("billable_instances")
    .select("amount, quantity")
    .eq("execution_study_key", studyKey)

  let expectedRevenue = 0
  for (const r of expSum ?? []) {
    const v = (r as { expected_revenue?: unknown }).expected_revenue
    expectedRevenue += typeof v === "number" ? v : Number(v ?? 0)
  }

  let actualAmount = 0
  for (const r of biSum ?? []) {
    const a = (r as { amount?: unknown }).amount
    const q = (r as { quantity?: unknown }).quantity
    const an = typeof a === "number" ? a : Number(a ?? 0)
    const qn = typeof q === "number" ? q : Number(q ?? 1)
    actualAmount += an * qn
  }

  const { data: recentEvents } = await supabase
    .from("event_log")
    .select("id, subject_id, visit_name, event_type, event_date")
    .eq("study_id", studyKey)
    .order("event_date", { ascending: false })
    .limit(5)

  const { data: recentLeakage } = await supabase
    .from("cliniq_action_items")
    .select("id, subject_id, visit_name, line_code, missing_amount, leakage_status, leakage_reason")
    .eq("study_id", studyKey)
    .gt("missing_amount", 0)
    .order("missing_amount", { ascending: false })
    .limit(5)

  const { data: recentInvoices } = await supabase
    .from("invoice_packages")
    .select("id, study_id, status, total_amount, invoice_period_start, invoice_period_end")
    .order("created_at", { ascending: false })
    .limit(5)

  return Response.json({
    ok: true,
    data: {
      study_key: studyKey,
      headline: {
        total_events: eventsRes.count ?? 0,
        total_expected_billables: expectedRes.count ?? 0,
        total_billable_instances: billablesRes.count ?? 0,
      },
      counts: {
        expected_billables: expectedRes.count ?? 0,
        event_log: eventsRes.count ?? 0,
        billable_instances: billablesRes.count ?? 0,
        leakage_action_items: leakageRes.count ?? 0,
        invoice_packages_all_studies: invoiceRes.count ?? 0,
      },
      totals: {
        expected_revenue: expectedRevenue,
        actual_billable_amount: actualAmount,
        revenue_gap: expectedRevenue - actualAmount,
      },
      samples: {
        recent_events: recentEvents ?? [],
        recent_leakage: recentLeakage ?? [],
        recent_invoice_packages: recentInvoices ?? [],
      },
    },
  })
}
