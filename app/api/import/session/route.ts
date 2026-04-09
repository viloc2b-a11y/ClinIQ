import { ensureUserPrimarySite } from "@/lib/import/ensure-user-primary-site"
import { isImportIntent } from "@/lib/import/parsed-budget-line"
import { parseUploadBuffer } from "@/lib/import/parse-upload-buffer"
import { createServerSupabaseClient } from "@/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 60

/**
 * Multipart upload: file + importIntent + studyKey (+ optional studyName, siteId).
 * Creates import session + lines (status in_review). Human review then PATCH + confirm.
 */
export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser()
  if (authErr || !user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ ok: false, error: "Expected multipart form data" }, { status: 400 })
  }

  const file = form.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Missing file" }, { status: 400 })
  }

  const importIntentRaw = String(form.get("importIntent") ?? "")
  if (!isImportIntent(importIntentRaw)) {
    return NextResponse.json({ ok: false, error: "Invalid importIntent" }, { status: 400 })
  }

  const studyKey = String(form.get("studyKey") ?? "STUDY-1").trim() || "STUDY-1"
  const studyName = String(form.get("studyName") ?? "").trim() || null
  const siteIdOpt = String(form.get("siteId") ?? "").trim()

  let siteId = siteIdOpt
  if (!siteId) {
    try {
      const ensured = await ensureUserPrimarySite(supabase, user.id)
      siteId = ensured.siteId
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return NextResponse.json({ ok: false, error: msg }, { status: 500 })
    }
  } else {
    const { data: membership, error: memErr } = await supabase
      .from("cliniq_site_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("site_id", siteId)
      .maybeSingle()

    if (memErr) {
      return NextResponse.json({ ok: false, error: memErr.message }, { status: 500 })
    }
    if (!membership) {
      return NextResponse.json(
        { ok: false, error: "Forbidden: you are not a member of that site" },
        { status: 403 },
      )
    }
  }

  const buf = Buffer.from(await file.arrayBuffer())
  const fileName = file.name || "upload"
  const mimeType = file.type || null

  let parsed
  try {
    parsed = await parseUploadBuffer({ fileName, mimeType, buffer: buf })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: `Parse failed: ${msg}` }, { status: 422 })
  }

  if (parsed.sourceType === "unknown") {
    return NextResponse.json(
      {
        ok: false,
        error: "Unsupported or unrecognized file type",
        parserWarnings: parsed.parserWarnings,
      },
      { status: 400 },
    )
  }

  const ext = fileName.includes(".") ? fileName.split(".").pop()?.toLowerCase() ?? "" : ""

  const { data: sessionRow, error: sessErr } = await supabase
    .from("cliniq_import_sessions")
    .insert({
      user_id: user.id,
      site_id: siteId,
      study_key: studyKey,
      study_name: studyName,
      import_intent: importIntentRaw,
      status: "in_review",
      original_filename: fileName,
      mime_type: mimeType,
      file_ext: ext,
      parser_warnings: parsed.parserWarnings,
    })
    .select("id")
    .single()

  if (sessErr || !sessionRow) {
    return NextResponse.json(
      { ok: false, error: sessErr?.message ?? "Failed to create import session" },
      { status: 500 },
    )
  }

  const sessionId = (sessionRow as { id: string }).id

  if (parsed.lines.length > 0) {
    const lineRows = parsed.lines.map((payload, sort_order) => ({
      session_id: sessionId,
      sort_order,
      excluded: false,
      payload,
    }))
    const { error: lineErr } = await supabase.from("cliniq_import_lines").insert(lineRows)
    if (lineErr) {
      await supabase.from("cliniq_import_sessions").delete().eq("id", sessionId)
      return NextResponse.json({ ok: false, error: lineErr.message }, { status: 500 })
    }
  }

  return NextResponse.json({
    ok: true,
    sessionId,
    sourceType: parsed.sourceType,
    lineCount: parsed.lines.length,
    parserWarnings: parsed.parserWarnings,
    siteId,
  })
}
