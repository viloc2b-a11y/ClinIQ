import { runOperationalExecution } from "@/lib/execution/run-operational-execution"
import {
  createExecutionSupabaseClient,
  executionSupabaseErrorResponse,
} from "@/lib/execution/service-supabase"

function parseSyncFlag(v: string | null): boolean {
  if (!v) return false
  const x = v.trim().toLowerCase()
  return x === "1" || x === "true" || x === "yes"
}

export async function GET(req: Request) {
  const supabase = createExecutionSupabaseClient()
  if (!supabase) return executionSupabaseErrorResponse()

  const { searchParams } = new URL(req.url)
  const studyKey = searchParams.get("study_key")?.trim() ?? ""
  const syncActionCenter = parseSyncFlag(searchParams.get("sync_action_center"))

  if (!studyKey) {
    return Response.json({ ok: false, error: "study_key is required", data: null }, { status: 400 })
  }

  const data = await runOperationalExecution(supabase, studyKey, { syncActionCenter })
  if (!data.ok) {
    return Response.json({ ok: false, error: data.error, data }, { status: 500 })
  }
  if (syncActionCenter && data.actionCenterSync.error) {
    return Response.json({ ok: false, error: data.actionCenterSync.error, data }, { status: 400 })
  }
  return Response.json({ ok: true, data, error: null })
}

export async function POST(req: Request) {
  const supabase = createExecutionSupabaseClient()
  if (!supabase) return executionSupabaseErrorResponse()

  let body: { study_key?: string; sync_action_center?: boolean }
  try {
    body = (await req.json()) as { study_key?: string; sync_action_center?: boolean }
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON", data: null }, { status: 400 })
  }

  const studyKey = body.study_key?.trim() ?? ""
  const syncActionCenter = body.sync_action_center === true

  if (!studyKey) {
    return Response.json({ ok: false, error: "study_key is required", data: null }, { status: 400 })
  }

  const data = await runOperationalExecution(supabase, studyKey, { syncActionCenter })
  if (!data.ok) {
    return Response.json({ ok: false, error: data.error, data }, { status: 500 })
  }
  if (syncActionCenter && data.actionCenterSync.error) {
    return Response.json({ ok: false, error: data.actionCenterSync.error, data }, { status: 400 })
  }
  return Response.json({ ok: true, data, error: null })
}
