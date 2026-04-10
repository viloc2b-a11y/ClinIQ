import { createSupabaseAdminClient } from "@/lib/admin/supabase-admin"
import { createExecutionSupabaseClient } from "@/lib/execution/service-supabase"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 60

const DEMO_SITE_ID = "e2000000-0000-4000-8000-000000000001"
const DEMO_USER_EMAIL = "demo@cliniqcloud.com"

function demoEnabled() {
  return String(process.env.CLINIQ_DEMO_NO_AUTH ?? "").trim() === "1"
}

export async function POST() {
  if (!demoEnabled()) {
    return NextResponse.json({ ok: false, error: "Demo no-auth mode disabled" }, { status: 403 })
  }

  const admin = createSupabaseAdminClient()
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Missing SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 })
  }

  const supabase = createExecutionSupabaseClient()
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Missing SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 })
  }

  // Create (or reuse) a demo auth user to satisfy FK constraints.
  let demoUserId: string | null = null
  const createRes = await admin.auth.admin.createUser({
    email: DEMO_USER_EMAIL,
    password: "Demo-Only-Do-Not-Use-For-Real-Login-123!",
    email_confirm: true,
    user_metadata: { cliniq_demo: true },
  })
  if (createRes.data.user?.id) {
    demoUserId = createRes.data.user.id
  } else if (createRes.error) {
    // If user already exists, attempt to find it.
    const listRes = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
    const found = listRes.data?.users?.find((u) => (u.email ?? "").toLowerCase() === DEMO_USER_EMAIL.toLowerCase())
    if (!found?.id) {
      return NextResponse.json({ ok: false, error: createRes.error.message }, { status: 500 })
    }
    demoUserId = found.id
  }

  if (!demoUserId) {
    return NextResponse.json({ ok: false, error: "Could not resolve demo user" }, { status: 500 })
  }

  // Ensure demo site exists (stable UUID matches execution seed).
  const { error: siteErr } = await supabase.from("cliniq_sites").upsert(
    {
      id: DEMO_SITE_ID,
      name: "Demo Site",
      created_by: demoUserId,
    },
    { onConflict: "id" },
  )
  if (siteErr) return NextResponse.json({ ok: false, error: siteErr.message }, { status: 500 })

  // Seed one intake session + a few canonical lines.
  const now = new Date().toISOString()
  const { data: sess, error: sessErr } = await supabase
    .from("cliniq_import_sessions")
    .insert({
      user_id: demoUserId,
      site_id: DEMO_SITE_ID,
      study_key: "STUDY-1",
      study_name: "STUDY-1 Demo Study",
      import_intent: "contract_financial",
      status: "confirmed",
      original_filename: "demo-contract-assumptions.pdf",
      mime_type: "application/pdf",
      file_ext: "pdf",
      parser_warnings: [],
      sponsor_name: "Acme Pharma",
      cro_name: "Northbridge CRO",
      created_at: now,
      updated_at: now,
    } as any)
    .select("id")
    .single()

  if (sessErr || !sess?.id) {
    return NextResponse.json({ ok: false, error: sessErr?.message ?? "Seed session failed" }, { status: 500 })
  }

  const sessionId = String(sess.id)
  const lines = [
    {
      lineId: "demo-line-1",
      sourceType: "pdf",
      category: "startup",
      itemDescription: "Site activation fee (CTA execution)",
      unitType: "flat",
      quantity: 1,
      unitPrice: 6200,
      totalPrice: 6200,
      visitName: null,
      notes: "Sponsor: Acme Pharma · CRO: Northbridge",
      confidence: "medium",
      warnings: [],
    },
    {
      lineId: "demo-line-2",
      sourceType: "pdf",
      category: "per_patient",
      itemDescription: "Screening visit",
      unitType: "visit",
      quantity: 1,
      unitPrice: 520,
      totalPrice: 520,
      visitName: "Visit 1",
      notes: null,
      confidence: "medium",
      warnings: [],
    },
  ]

  const { error: lineErr } = await supabase.from("cliniq_import_lines").insert(
    lines.map((payload, i) => ({
      session_id: sessionId,
      sort_order: i,
      excluded: false,
      payload,
    })),
  )
  if (lineErr) return NextResponse.json({ ok: false, error: lineErr.message }, { status: 500 })

  return NextResponse.json({
    ok: true,
    site_id: DEMO_SITE_ID,
    demo_user_email: DEMO_USER_EMAIL,
    seeded: { session_id: sessionId, line_count: lines.length },
  })
}

