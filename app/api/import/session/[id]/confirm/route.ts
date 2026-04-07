import { mapParsedLinesToBudgetGapInput } from "@/lib/import/map-to-budget-gap-lines"
import type { ImportIntent, ParsedBudgetLine } from "@/lib/import/parsed-budget-line"
import { isImportIntent } from "@/lib/import/parsed-budget-line"
import { createServerSupabaseClient } from "@/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

type ImportSessionRow = {
  id: string
  user_id: string
  site_id: string
  study_key: string
  study_name: string | null
  import_intent: string
  status: string
}

/**
 * POST — persist draft budget version + mark session confirmed.
 */
export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: sessionId } = await context.params
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const { data: session, error: sErr } = await supabase
    .from("cliniq_import_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle()

  if (sErr || !session) {
    return NextResponse.json({ ok: false, error: "Session not found" }, { status: 404 })
  }

  const s = session as ImportSessionRow
  if (s.user_id !== user.id) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 })
  }
  if (s.status === "confirmed") {
    return NextResponse.json({ ok: false, error: "Already confirmed" }, { status: 409 })
  }
  if (!isImportIntent(s.import_intent)) {
    return NextResponse.json({ ok: false, error: "Invalid session intent" }, { status: 500 })
  }

  const { data: lineRows, error: lErr } = await supabase
    .from("cliniq_import_lines")
    .select("excluded, payload, sort_order")
    .eq("session_id", sessionId)
    .order("sort_order", { ascending: true })

  if (lErr) {
    return NextResponse.json({ ok: false, error: lErr.message }, { status: 500 })
  }

  const active: ParsedBudgetLine[] = (lineRows ?? [])
    .filter((r: { excluded: boolean }) => !r.excluded)
    .map((r: { payload: ParsedBudgetLine }) => r.payload)

  const { internalLines, sponsorLines } = mapParsedLinesToBudgetGapInput(
    active,
    s.import_intent as ImportIntent,
  )

  const { data: draft, error: dErr } = await supabase
    .from("cliniq_budget_draft_versions")
    .insert({
      user_id: user.id,
      site_id: s.site_id,
      study_key: s.study_key,
      study_name: s.study_name,
      import_intent: s.import_intent,
      label: `Import ${new Date().toISOString().slice(0, 10)}`,
      internal_lines: internalLines,
      sponsor_lines: sponsorLines,
      source_import_session_id: sessionId,
    })
    .select("id")
    .single()

  if (dErr || !draft) {
    return NextResponse.json({ ok: false, error: dErr?.message ?? "Draft insert failed" }, { status: 500 })
  }

  const draftId = (draft as { id: string }).id

  const { error: uErr } = await supabase
    .from("cliniq_import_sessions")
    .update({ status: "confirmed", updated_at: new Date().toISOString() })
    .eq("id", sessionId)

  if (uErr) {
    return NextResponse.json({ ok: false, error: uErr.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    draftId,
    internalLineCount: internalLines.length,
    sponsorLineCount: sponsorLines.length,
  })
}
