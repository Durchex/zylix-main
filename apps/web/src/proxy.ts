import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/account", "/admin"];
// Set by useAuthStore (see auth.store.ts) — a plain, client-readable marker,
// not the API's httpOnly "zylix_rt" refresh cookie. Middleware can't verify
// a JWT signature at the edge, so this is a fast, cheap presence check for
// UX redirects; AuthGuard and the API's requireAuth are the real boundary.
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
  matcher: ["/account/:path*", "/admin/:path*"],
};
