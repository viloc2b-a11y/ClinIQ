import { createExecutionSupabaseClient } from "@/lib/execution/service-supabase"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Read-only negotiation line items for a deal (service role).
 */
export async function GET(req: Request) {
  const supabase = createExecutionSupabaseClient()
  if (!supabase) {
    return NextResponse.json({ ok: true, data: [] as const, degraded: true })
  }

  const { searchParams } = new URL(req.url)
  const dealId = String(searchParams.get("deal_id") ?? "").trim()
  if (!dealId || !uuidRe.test(dealId)) {
    return NextResponse.json({ ok: true, data: [] as const })
  }

  const { data, error } = await supabase
    .from("negotiation_items")
    .select(
      "id, deal_id, source_line_id, line_code, label, current_price, internal_cost, proposed_price, justification, status, updated_at",
    )
    .eq("deal_id", dealId)
    .order("updated_at", { ascending: false })
    .limit(500)

  if (error) {
    return NextResponse.json({ ok: true, data: [] as const, degraded: true, warning: error.message })
  }

  return NextResponse.json({ ok: true, data: data ?? [] })
}
