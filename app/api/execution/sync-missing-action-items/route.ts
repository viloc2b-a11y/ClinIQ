import { runOperationalExecution } from "@/lib/execution/run-operational-execution"
import {
  createExecutionSupabaseClient,
  executionSupabaseErrorResponse,
} from "@/lib/execution/service-supabase"

export async function POST(req: Request) {
  const supabase = createExecutionSupabaseClient()
  if (!supabase) return executionSupabaseErrorResponse()

  let body: { study_key?: string }
  try {
    body = (await req.json()) as { study_key?: string }
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 })
  }

  const studyKey = body.study_key?.trim()
  if (!studyKey) {
    return Response.json({ ok: false, error: "study_key is required" }, { status: 400 })
  }

  const data = await runOperationalExecution(supabase, studyKey, { syncActionCenter: true })
  if (!data.ok) {
    return Response.json({ ok: false, error: data.error }, { status: 500 })
  }
  if (data.actionCenterSync.error) {
    return Response.json({ ok: false, error: data.actionCenterSync.error, data }, { status: 400 })
  }

  return Response.json({
    ok: true,
    data: {
      study_key: data.studyKey,
      upserted: data.actionCenterSync.upserted,
      leakage: {
        missing_revenue: data.leakage.missingRevenue,
        missing_line_count: data.leakage.missingLineCount,
      },
    },
  })
}
