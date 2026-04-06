import {
  createExecutionSupabaseClient,
  executionSupabaseErrorResponse,
} from "@/lib/execution/service-supabase"

export async function GET(req: Request) {
  const supabase = createExecutionSupabaseClient()
  if (!supabase) return executionSupabaseErrorResponse()

  const { searchParams } = new URL(req.url)
  const studyId = searchParams.get("study_id")?.trim()
  const limit = Math.min(Number(searchParams.get("limit") ?? "200") || 200, 500)

  let q = supabase.from("expected_billables").select("*").order("visit_name").limit(limit)
  if (studyId) q = q.eq("study_id", studyId)

  const { data, error } = await q
  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true, data: data ?? [] })
}
