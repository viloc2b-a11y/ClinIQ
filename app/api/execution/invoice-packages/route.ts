export const dynamic = 'force-dynamic'

import {
  createExecutionSupabaseClient,
  executionSupabaseErrorResponse,
} from "@/lib/execution/service-supabase"

export async function GET(req: Request) {
  const supabase = createExecutionSupabaseClient()
  if (!supabase) return executionSupabaseErrorResponse()

  const { searchParams } = new URL(req.url)
  const studyUuid = searchParams.get("study_uuid")?.trim()
  const limit = Math.min(Number(searchParams.get("limit") ?? "50") || 50, 200)

  let q = supabase
    .from("invoice_packages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (studyUuid) q = q.eq("study_id", studyUuid)

  const { data, error } = await q
  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true, data: data ?? [] })
}
