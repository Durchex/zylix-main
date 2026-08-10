import { NextRequest, NextResponse } from "next/server";

// Temporary diagnostic: zylix-web has been returning 502 on every request on
// Render's free plan despite clean startup logs ("Ready" / "live" every
// deploy) and no crash ever being logged. That gap — no visibility into
// whether requests are reaching the Node process at all — is what this
// logs. If this line never appears in Render's Logs tab for a request that
// 502s in the browser, the request isn't reaching this process (an edge/
// routing problem outside the app); if it does appear, the failure is
// somewhere in rendering, which points back at app code.
export function middleware(request: NextRequest) {
  console.log(
    `[middleware] ${new Date().toISOString()} ${request.method} ${request.nextUrl.pathname}`,
  );
  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};
