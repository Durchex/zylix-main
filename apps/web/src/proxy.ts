import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/account", "/seller", "/admin"];
// Set by useAuthStore on this domain (see auth.store.ts) — not the API's
// httpOnly "zylix_rt" refresh cookie, which lives on the API's own domain
// and is invisible here when the frontend and API are deployed separately.
const SESSION_MARKER_COOKIE = "zylix_session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
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
  matcher: ["/account/:path*", "/seller/:path*", "/admin/:path*"],
};
