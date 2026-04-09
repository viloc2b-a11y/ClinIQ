import { createSupabaseAdminClient } from "@/lib/admin/supabase-admin"
import { createExecutionSupabaseClient } from "@/lib/execution/service-supabase"
import { isImportIntent, type ParsedBudgetLine } from "@/lib/import/parsed-budget-line"
import { parseUploadBuffer } from "@/lib/import/parse-upload-buffer"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 60

const DEMO_SITE_ID = "e2000000-0000-4000-8000-000000000001"
const DEMO_USER_EMAIL = "demo@cliniqcloud.com"

function demoEnabled() {
  return String(process.env.CLINIQ_DEMO_NO_AUTH ?? "").trim() === "1"
}

async function resolveDemoUserId() {
  const admin = createSupabaseAdminClient()
  if (!admin) return { ok: false as const, error: "Missing SUPABASE_SERVICE_ROLE_KEY" }

  // Create or reuse demo user.
  const createRes = await admin.auth.admin.createUser({
    email: DEMO_USER_EMAIL,
    password: "Demo-Only-Do-Not-Use-For-Real-Login-123!",
    email_confirm: true,
    user_metadata: { cliniq_demo: true },
  })
  if (createRes.data.user?.id) return { ok: true as const, userId: createRes.data.user.id }

  const listRes = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  const found = listRes.data?.users?.find((u) => (u.email ?? "").toLowerCase() === DEMO_USER_EMAIL.toLowerCase())
  if (!found?.id) return { ok: false as const, error: createRes.error?.message ?? "Could not resolve demo user" }
  return { ok: true as const, userId: found.id }
}

export async function POST(req: Request) {
  if (!demoEnabled()) return NextResponse.json({ ok: false, error: "Demo no-auth mode disabled" }, { status: 403 })

  const supabase = createExecutionSupabaseClient()
  if (!supabase) return NextResponse.json({ ok: false, error: "Missing SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 })

  const userRes = await resolveDemoUserId()
  if (!userRes.ok) return NextResponse.json({ ok: false, error: userRes.error }, { status: 500 })

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ ok: false, error: "Expected multipart form data" }, { status: 400 })
  }

  const file = form.get("file")
  if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "Missing file" }, { status: 400 })

  const importIntentRaw = String(form.get("importIntent") ?? "")
  if (!isImportIntent(importIntentRaw)) {
    return NextResponse.json({ ok: false, error: "Invalid importIntent" }, { status: 400 })
  }

  const studyKey = String(form.get("studyKey") ?? "STUDY-1").trim() || "STUDY-1"
  const studyName = String(form.get("studyName") ?? "").trim() || null
  const sponsorName = String(form.get("sponsorName") ?? "").trim() || null
  const croName = String(form.get("croName") ?? "").trim() || null

  const buf = Buffer.from(await file.arrayBuffer())
  const fileName = file.name || "upload"
  const mimeType = file.type || null

  const parsed = await parseUploadBuffer({ fileName, mimeType, buffer: buf })
  if (parsed.sourceType === "unknown") {
    return NextResponse.json(
      { ok: false, error: "Unsupported or unrecognized file type", parserWarnings: parsed.parserWarnings },
      { status: 400 },
    )
  }

  // Ensure demo site exists (requires migration for parties fields already applied).
  await supabase.from("cliniq_sites").upsert(
    { id: DEMO_SITE_ID, name: "Demo Site", created_by: userRes.userId },
    { onConflict: "id" },
  )

  const ext = fileName.includes(".") ? fileName.split(".").pop()?.toLowerCase() ?? "" : ""
  const { data: sessionRow, error: sessErr } = await supabase
    .from("cliniq_import_sessions")
    .insert({
      user_id: userRes.userId,
      site_id: DEMO_SITE_ID,
      study_key: studyKey,
      study_name: studyName,
      import_intent: importIntentRaw,
      status: "in_review",
      original_filename: fileName,
      mime_type: mimeType,
      file_ext: ext,
      parser_warnings: parsed.parserWarnings,
      sponsor_name: sponsorName,
      cro_name: croName,
    } as any)
    .select("id")
    .single()

  if (sessErr || !sessionRow?.id) {
    return NextResponse.json({ ok: false, error: sessErr?.message ?? "Failed to create import session" }, { status: 500 })
  }
  const sessionId = String(sessionRow.id)

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
    siteId: DEMO_SITE_ID,
    sourceType: parsed.sourceType,
    lineCount: parsed.lines.length,
    parserWarnings: parsed.parserWarnings,
    lines: parsed.lines.slice(0, 250) as ParsedBudgetLine[],
  })
}

