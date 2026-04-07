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
  const limit = Math.min(Number(searchParams.get("limit") ?? "200") || 200, 500)

  let q = supabase
    .from("billable_instances")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (studyKey) q = q.eq("execution_study_key", studyKey)

  const { data, error } = await q
  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true, data: data ?? [] })
}
