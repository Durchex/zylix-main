import { NextResponse } from "next/server";
import { withRoute } from "@/server/http/route";
import { requireAuth } from "@/server/http/auth";
import { clearRefreshCookie } from "@/server/http/cookies";
import { authService } from "@/server/services/auth.service";

export const POST = withRoute(async (req) => {
  const user = requireAuth(req);
  await authService.logoutAll(user.id);

  const res = new NextResponse(null, { status: 204 });
  clearRefreshCookie(res);
  return res;
});
