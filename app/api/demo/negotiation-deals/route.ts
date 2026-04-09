import { createExecutionSupabaseClient } from "@/lib/execution/service-supabase"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

/**
 * Read-only demo list of negotiation deals for a study (service role).
 * Returns an empty list when credentials are missing so the UI never hard-fails.
 */
export async function GET(req: Request) {
  const supabase = createExecutionSupabaseClient()
  if (!supabase) {
    return NextResponse.json({ ok: true, data: [] as const, degraded: true })
  }

  const { searchParams } = new URL(req.url)
  const studyKey = String(searchParams.get("study_key") ?? "STUDY-1").trim() || "STUDY-1"

  const { data, error } = await supabase
    .from("negotiation_deals")
    .select("deal_id, study_key, study_name, status, last_updated_at")
    .eq("study_key", studyKey)
    .eq("status", "open")
    .order("last_updated_at", { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ ok: true, data: [] as const, degraded: true, warning: error.message })
  }

  return NextResponse.json({ ok: true, data: data ?? [] })
}
