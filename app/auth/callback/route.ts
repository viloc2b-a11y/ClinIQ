import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * OAuth / magic-link / invite acceptance: exchanges `code` for a session.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/admin";
  const isAdminNext = next.startsWith("/admin") && !next.startsWith("/admin/denied");

  if (!code) {
    const loginPath = isAdminNext ? "/admin/login" : "/auth/login";
    return NextResponse.redirect(new URL(`${loginPath}?error=missing_code`, request.url));
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    const loginPath = isAdminNext ? "/admin/login" : "/auth/login";
    return NextResponse.redirect(new URL(`${loginPath}?error=config`, request.url));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          /* ignore when cookies are read-only */
        }
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const loginPath = isAdminNext ? "/admin/login" : "/auth/login";
    return NextResponse.redirect(
      new URL(`${loginPath}?error=${encodeURIComponent(error.message)}`, request.url),
    );
  }

  const redirectPath = next.startsWith("/") ? next : `/${next}`;
  return NextResponse.redirect(new URL(redirectPath, requestUrl.origin));
}
