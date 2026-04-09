import { createServerSupabaseClient } from "@/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

/** List sites the current user belongs to. */
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const { data: members, error: mErr } = await supabase
    .from("cliniq_site_members")
    .select("site_id, role")
    .eq("user_id", user.id)

  if (mErr) {
    return NextResponse.json({ ok: false, error: mErr.message }, { status: 500 })
  }

  const memList = (members ?? []) as { site_id: string; role: string }[]
  const ids = [...new Set(memList.map((m) => m.site_id))]
  if (ids.length === 0) {
    return NextResponse.json({ ok: true, sites: [] })
  }

  const { data: siteRows, error: sErr } = await supabase
    .from("cliniq_sites")
    .select("id, name, created_at")
    .in("id", ids)

  if (sErr) {
    return NextResponse.json({ ok: false, error: sErr.message }, { status: 500 })
  }

  const byId = new Map(
    (siteRows ?? []).map((r) => {
      const row = r as { id: string; name: string; created_at: string }
      return [row.id, row] as const
    }),
  )

  const sites = memList.map((m) => {
    const s = byId.get(m.site_id)
    return {
      id: m.site_id,
      role: m.role,
      name: s?.name ?? "Site",
      createdAt: s?.created_at,
    }
  })

  return NextResponse.json({ ok: true, sites })
}

/** Create a new site (user becomes owner via trigger). */
export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  let body: { name?: string }
  try {
    body = (await req.json()) as { name?: string }
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 })
  }
  const name = String(body.name ?? "").trim() || "New site"

  const { data: site, error } = await supabase
    .from("cliniq_sites")
    .insert({ name, created_by: user.id })
    .select("id, name, created_at")
    .single()

  if (error || !site) {
    return NextResponse.json({ ok: false, error: error?.message ?? "Insert failed" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, site })
}
