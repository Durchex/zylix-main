import { NextResponse } from "next/server";
import { withRoute, clientIp } from "@/server/http/route";
import { ApiError } from "@/server/http/errors";
import { readRefreshCookie, setRefreshCookie } from "@/server/http/cookies";
import { authService } from "@/server/services/auth.service";

export const POST = withRoute(async (req) => {
  const rawRefreshToken = readRefreshCookie(req);
  if (!rawRefreshToken) {
    throw new ApiError(401, "Session expired, please log in again");
  }

  const result = await authService.refreshSession(rawRefreshToken, {
    userAgent: req.headers.get("user-agent") ?? undefined,
    ipAddress: clientIp(req),
  });

  const res = NextResponse.json({ user: result.user, accessToken: result.accessToken });
  setRefreshCookie(res, result.refreshToken);
  return res;
});
