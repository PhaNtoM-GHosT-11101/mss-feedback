import { NextResponse, type NextRequest } from "next/server";

// Passed to Server Components / Server Actions so they know the institution context.
// Only ever set internally (by this proxy); treated as a loop guard too.
export const INST_HEADER = "x-institution-slug";
export const INST_COOKIE = "inst_slug";

// Reserved top-level paths (never treated as college slugs).
const RESERVED = new Set([
  "login",
  "complaints",
  "admin",
  "profile",
  "auth",
  "playground",
  "mess",
  "praise",
  "stats",
  "onboard",
  "favicon.ico",
  "_next",
  "icon",
  "apple-icon",
  "manifest",
  "robots.txt",
  "sitemap.xml",
]);

// Feature routes removed from the app — send visitors home instead of 404.
const LEGACY = new Set(["mess", "praise", "stats", "onboard"]);

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

  const cookie = request.cookies.get(INST_COOKIE)?.value;

  // --- Path carries an institution slug: reading is open to everyone. --------
  if (slug) {
    // Removed feature pages (e.g. /nit-agartala/mess) bounce to the board.
    const strippedFirst = stripped.split("/").filter(Boolean)[0] ?? "";
    if (LEGACY.has(strippedFirst)) {
      const url = request.nextUrl.clone();
      url.pathname = `/${slug}`;
      url.search = "";
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

  // --- Removed top-level feature pages -> home. ------------------------------
  if (LEGACY.has(first) && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // --- No slug in path --------------------------------------------------------
  const inject = (nextResponse: NextResponse) => {
    if (cookie) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set(INST_HEADER, cookie);
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
    return nextResponse;
  };

  // Home doubles as the board: return the visitor to the college they last used.
  if (pathname === "/") {
    return inject(NextResponse.next());
  }

  // Public/auth flows reachable without an institution.
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Everywhere else still works without a login — just without a college header.
  return inject(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};