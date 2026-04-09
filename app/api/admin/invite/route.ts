import { isAllowedAdminEmail } from "@/lib/admin/is-allowed-admin";
import {
  createSupabaseAdminClient,
  getPublicAppUrl,
} from "@/lib/admin/supabase-admin";
import { createServerSupabaseClient } from "@/supabase/server";
import { NextResponse } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const email =
    typeof body === "object" &&
    body !== null &&
    "email" in body &&
    typeof (body as { email: unknown }).email === "string"
      ? (body as { email: string }).email.trim()
      : "";

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Valid email is required" },
      { status: 400 },
    );
  }

  try {
    const supabaseUser = await createServerSupabaseClient();
    const {
      data: { user },
      error: userErr,
    } = await supabaseUser.auth.getUser();

    if (userErr || !user?.email || !isAllowedAdminEmail(user.email)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const admin = createSupabaseAdminClient();
    if (!admin) {
      return NextResponse.json(
        { ok: false, error: "Server missing Supabase service role configuration" },
        { status: 500 },
      );
    }

    const base = getPublicAppUrl();
    const redirectTo = base
      ? `${base}/auth/callback?next=${encodeURIComponent("/admin")}`
      : undefined;

    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: {
        invited_by: user.email,
      },
    });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      user: data.user
        ? { id: data.user.id, email: data.user.email }
        : null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
