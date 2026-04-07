export const dynamic = 'force-dynamic'

import {
  createExecutionSupabaseClient,
  executionSupabaseErrorResponse,
} from "@/lib/execution/service-supabase"

export async function GET(req: Request) {
  const supabase = createExecutionSupabaseClient()
  if (!supabase) return executionSupabaseErrorResponse()

  const { searchParams } = new URL(req.url)
  const studyId = searchParams.get("study_id")?.trim()
  const limit = Math.min(Number(searchParams.get("limit") ?? "100") || 100, 500)

  let q = supabase.from("visit_log").select("*").order("event_date", { ascending: false }).limit(limit)
  if (studyId) q = q.eq("study_id", studyId)

  const { data, error } = await q
  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true, data: data ?? [] })
}
