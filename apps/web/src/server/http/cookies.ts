import "server-only";
import type { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/server/config/env";

export const REFRESH_COOKIE_NAME = "zylix_rt";
const REFRESH_COOKIE_MAX_AGE_S = 30 * 24 * 60 * 60;
const REFRESH_COOKIE_PATH = "/api/v1/auth";

/**
 * The API and the site are now one Vercel deployment on one origin, so the
 * refresh cookie is same-site again and goes back to `SameSite=Lax`. The
 * split Vercel-plus-Render deployment had forced `SameSite=None`, which
 * requires the browser to attach the cookie on cross-site requests — exactly
 * the property CSRF depends on, and the reason the old setup broke whenever
 * the domain changed. Lax is both stricter and no longer domain-sensitive.
 */
export function setRefreshCookie(res: NextResponse, token: string): void {
  res.cookies.set({
    name: REFRESH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: getEnv().NODE_ENV === "production",
    sameSite: "lax",
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_COOKIE_MAX_AGE_S,
  });
}

export function clearRefreshCookie(res: NextResponse): void {
  res.cookies.set({
    name: REFRESH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: getEnv().NODE_ENV === "production",
    sameSite: "lax",
    path: REFRESH_COOKIE_PATH,
    maxAge: 0,
  });
}

export function readRefreshCookie(req: NextRequest): string | undefined {
  return req.cookies.get(REFRESH_COOKIE_NAME)?.value;
}
