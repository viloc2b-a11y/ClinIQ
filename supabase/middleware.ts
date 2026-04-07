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
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/import")) {
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
