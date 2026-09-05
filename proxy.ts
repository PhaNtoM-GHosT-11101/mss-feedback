import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Passed to Server Components / Server Actions so they know the institution context.
// Only ever set internally (by this proxy); treated as a loop guard too.
export const INST_HEADER = "x-institution-slug";
export const INST_COOKIE = "inst_slug";

const RESERVED = new Set([
  "login",
  "onboard",
  "complaints",
  "mess",
  "admin",
  "stats",
  "praise",
  "profile",
  "auth",
  "playground",
  "favicon.ico",
  "_next",
  "icon",
  "apple-icon",
  "manifest",
  "robots.txt",
  "sitemap.xml",
]);

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PUBLIC_PATHS = ["/login", "/auth/callback", "/auth/token", "/playground"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Loop guard: this is an internal rewrite already carrying context. ------
  if (request.headers.get(INST_HEADER)) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0] ?? "";
  const isSlug = !!(first && !RESERVED.has(first) && SLUG_RE.test(first));
  const slug = isSlug ? first : null;
  const stripped = slug ? "/" + segments.slice(1).join("/") : pathname;

  // Local-only session check (reads + decodes chunked cookies, no network).
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // read-only
        },
      },
    },
  );
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const cookie = request.cookies.get(INST_COOKIE)?.value;

  // --- TESTING BYPASS --------------------------------------------------------
  // When NEXT_PUBLIC_AUTH_BYPASS=1 we skip the login wall so the app can be
  // browsed without a Google account. Routing/login redirects are relaxed and
  // the institution context is always injected for slug paths.
  const BYPASS = process.env.NEXT_PUBLIC_AUTH_BYPASS === "1";

  // --- Path carries an institution slug --------------------------------------
  if (slug) {
    if (!session && !BYPASS) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    const url = request.nextUrl.clone();
    url.pathname = stripped;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(INST_HEADER, slug);
    const response = NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
    response.cookies.set(INST_COOKIE, slug, {
      path: "/",
      maxAge: 60 * 60 * 24 * 60,
      sameSite: "lax",
    });
    return response;
  }

  // --- No slug in path --------------------------------------------------------
  // Public/auth flows reachable without an institution.
  if (pathname === "/" || PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Authed with a cookie -> inject the institution context (internal navigation).
  if (cookie && session) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(INST_HEADER, cookie);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Authed but no institution known -> picker, remember where they were heading.
  if (session) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // TESTING: allow unauthenticated internal navigation through.
  if (BYPASS && cookie) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(INST_HEADER, cookie);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Not authed -> login (no institution to fall back to, so land on login).
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
