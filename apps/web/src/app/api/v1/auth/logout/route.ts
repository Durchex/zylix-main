import { NextResponse } from "next/server";
import { withRoute } from "@/server/http/route";
import { clearRefreshCookie, readRefreshCookie } from "@/server/http/cookies";
import { authService } from "@/server/services/auth.service";

export const POST = withRoute(async (req) => {
  const rawRefreshToken = readRefreshCookie(req);
  if (rawRefreshToken) {
    await authService.logout(rawRefreshToken);
  }

  const res = new NextResponse(null, { status: 204 });
  clearRefreshCookie(res);
  return res;
});
