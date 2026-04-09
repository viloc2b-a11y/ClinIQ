import { createServerSupabaseClient } from "@/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const { data: draft, error } = await supabase
    .from("cliniq_budget_draft_versions")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error || !draft) {
    return NextResponse.json({ ok: false, error: "Draft not found" }, { status: 404 })
  }
  if ((draft as { user_id: string }).user_id !== user.id) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json({ ok: true, draft })
}
