import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/account", "/seller", "/admin"];
// Set by useAuthStore on this domain (see auth.store.ts) — not the API's
// httpOnly "zylix_rt" refresh cookie, which lives on the API's own domain
// and is invisible here when the frontend and API are deployed separately.
const SESSION_MARKER_COOKIE = "zylix_session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Temporary diagnostic: zylix-web has been returning 502 on every request
  // on Render's free plan despite clean startup logs and no crash ever
  // being logged, so there's no visibility into whether requests reach this
  // process at all. This logs every request that hits Next's proxy (Next
  // 16's renamed middleware) so Render's Logs tab gives a definitive answer
  // — if this line is missing for a request that 502s in the browser, the
  // problem is upstream of the app; if present, it's in rendering.
  console.log(`[proxy] ${new Date().toISOString()} ${request.method} ${pathname}`);

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (!isProtected) {
    return NextResponse.next();
  }

  const hasSessionCookie = request.cookies.has(SESSION_MARKER_COOKIE);
  if (!hasSessionCookie) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Widened temporarily (was just the protected prefixes) so the
  // diagnostic log above fires for every real page request, including "/",
  // which is one of the routes that 502s.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
