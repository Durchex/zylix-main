import { NextResponse } from "next/server";
import { withRoute, readJson, clientIp } from "@/server/http/route";
import { enforceRateLimit, authRateLimit } from "@/server/http/rateLimit";
import { setRefreshCookie } from "@/server/http/cookies";
import { authService } from "@/server/services/auth.service";
import { loginSchema } from "@/server/validation/auth.schema";

export const POST = withRoute(async (req) => {
  await enforceRateLimit(req, authRateLimit);

  const input = loginSchema.parse(await readJson(req));
  const result = await authService.login(input, {
    userAgent: req.headers.get("user-agent") ?? undefined,
    ipAddress: clientIp(req),
  });

  if (result.requiresTwoFactor) {
    return NextResponse.json({ requiresTwoFactor: true });
  }

  const res = NextResponse.json({ user: result.user, accessToken: result.accessToken });
  setRefreshCookie(res, result.refreshToken);
  return res;
});
