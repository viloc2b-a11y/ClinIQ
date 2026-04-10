import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { isAllowedAdminEmail } from "@/lib/admin/is-allowed-admin";

/**
 * Refreshes Supabase auth cookies on each matched request.
 * Wire this from the root `middleware.ts`.
 * Also gates `/admin/*` (except login) behind session + admin allowlist.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return response;
  }

  let user: { email?: string | null } | null = null;

  try {
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    user = u;
  } catch (err) {
    // Bad Supabase URL/key, network failure, or SSR cookie edge cases should not 500 the whole app.
    if (process.env.NODE_ENV === "development") {
      console.warn("[middleware] Supabase session refresh failed:", err);
    }
    return NextResponse.next({ request });
  }

  const pathname = request.nextUrl.pathname;
  const demoNoAuth = String(process.env.CLINIQ_DEMO_NO_AUTH ?? "").trim() === "1";

  if (pathname.startsWith("/import")) {
    const isDemoImport = pathname === "/import/demo" || pathname.startsWith("/import/demo/");
    if (demoNoAuth && isDemoImport) {
      return response;
    }
    if (!user) {
      const login = new URL("/auth/login", request.url);
      login.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(login);
    }
  }

  if (pathname.startsWith("/auth/login")) {
    if (user) {
      const nextParam = request.nextUrl.searchParams.get("next");
      const dest =
        nextParam && nextParam.startsWith("/") ? nextParam : "/import";
      return NextResponse.redirect(new URL(dest, request.url));
    }
    if (demoNoAuth) {
      const nextParam = request.nextUrl.searchParams.get("next");
      const dest = nextParam && nextParam.startsWith("/") ? nextParam : "/import/demo";
      return NextResponse.redirect(new URL(dest, request.url));
    }
  }

  if (pathname.startsWith("/admin")) {
    const isLogin = pathname.startsWith("/admin/login");
    const isDenied = pathname.startsWith("/admin/denied");

    if (isLogin) {
      if (user) {
        if (isAllowedAdminEmail(user.email)) {
          return NextResponse.redirect(new URL("/admin", request.url));
        }
        return NextResponse.redirect(new URL("/admin/denied", request.url));
      }
    } else if (isDenied) {
      if (!user) {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }
      if (isAllowedAdminEmail(user.email)) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    } else {
      if (!user) {
        const login = new URL("/admin/login", request.url);
        login.searchParams.set(
          "next",
          `${pathname}${request.nextUrl.search}`,
        );
        return NextResponse.redirect(login);
      }
      if (!isAllowedAdminEmail(user.email)) {
        return NextResponse.redirect(new URL("/admin/denied", request.url));
      }
    }
  }

  return response;
}
