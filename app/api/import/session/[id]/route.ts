import type { ParsedBudgetLine } from "@/lib/import/parsed-budget-line"
import { createServerSupabaseClient } from "@/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

type LineRow = {
  id: string
  sort_order: number
  excluded: boolean
  payload: ParsedBudgetLine
}

/**
 * GET — session header + lines for review UI.
 */
export async function GET(
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
  if ((session as { user_id: string }).user_id !== user.id) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 })
  }

  const { data: lines, error: lErr } = await supabase
    .from("cliniq_import_lines")
    .select("id, sort_order, excluded, payload")
    .eq("session_id", sessionId)
    .order("sort_order", { ascending: true })

  if (lErr) {
    return NextResponse.json({ ok: false, error: lErr.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    session,
    lines: (lines ?? []) as LineRow[],
  })
}

type PatchBody =
  | {
      replaceAll: true
      rows: Array<{ payload: ParsedBudgetLine; excluded: boolean }>
    }
  | {
      lines: Array<{
        lineId: string
        excluded?: boolean
        payload?: ParsedBudgetLine
      }>
    }

/**
 * PATCH — full replace (add/remove lines) or per-line updates by lineId.
 */
export async function PATCH(
  req: Request,
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
    .select("id, user_id, status")
    .eq("id", sessionId)
    .maybeSingle()

  if (sErr || !session) {
    return NextResponse.json({ ok: false, error: "Session not found" }, { status: 404 })
  }
  if ((session as { user_id: string }).user_id !== user.id) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 })
  }
  if ((session as { status: string }).status === "confirmed") {
    return NextResponse.json({ ok: false, error: "Session already confirmed" }, { status: 409 })
  }

  let body: PatchBody
  try {
    body = (await req.json()) as PatchBody
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 })
  }

  if ("replaceAll" in body && body.replaceAll) {
    if (!Array.isArray(body.rows)) {
      return NextResponse.json({ ok: false, error: "rows array required" }, { status: 400 })
    }
    const { error: delErr } = await supabase
      .from("cliniq_import_lines")
      .delete()
      .eq("session_id", sessionId)
    if (delErr) {
      return NextResponse.json({ ok: false, error: delErr.message }, { status: 500 })
    }
    if (body.rows.length > 0) {
      const inserts = body.rows.map((r, sort_order) => ({
        session_id: sessionId,
        sort_order,
        excluded: r.excluded,
        payload: r.payload,
      }))
      const { error: insErr } = await supabase.from("cliniq_import_lines").insert(inserts)
      if (insErr) {
        return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 })
      }
    }
  } else if ("lines" in body && Array.isArray(body.lines)) {
    const { data: existing, error: eErr } = await supabase
      .from("cliniq_import_lines")
      .select("id, sort_order, excluded, payload")
      .eq("session_id", sessionId)
      .order("sort_order", { ascending: true })

    if (eErr) {
      return NextResponse.json({ ok: false, error: eErr.message }, { status: 500 })
    }

    const rows = (existing ?? []) as LineRow[]
    const byLineId = new Map(rows.map((r) => [(r.payload as ParsedBudgetLine).lineId, r]))

    for (const upd of body.lines) {
      const row = byLineId.get(upd.lineId)
      if (!row) continue
      const nextPayload = upd.payload ?? row.payload
      const nextExcluded = upd.excluded ?? row.excluded
      const { error: uErr } = await supabase
        .from("cliniq_import_lines")
        .update({
          excluded: nextExcluded,
          payload: nextPayload,
        })
        .eq("id", row.id)
      if (uErr) {
        return NextResponse.json({ ok: false, error: uErr.message }, { status: 500 })
      }
    }
  } else {
    return NextResponse.json(
      { ok: false, error: "Expected replaceAll+rows or lines[]" },
      { status: 400 },
    )
  }

  await supabase
    .from("cliniq_import_sessions")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", sessionId)

  return NextResponse.json({ ok: true })
}
