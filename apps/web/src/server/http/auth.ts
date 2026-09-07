import "server-only";
import type { NextRequest } from "next/server";
import { verifyAccessToken } from "@/server/lib/jwt";
import { ApiError } from "./errors";
import type { Role } from "@/server/models/enums";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}

/**
 * Express attached the caller to `req.user` via middleware that ran before
 * the handler. Route handlers have no middleware chain, so the guards are
 * plain functions a handler calls on its first line and takes the result of —
 * which also makes it visible in each file exactly what it requires.
 */
export function requireAuth(req: NextRequest): AuthenticatedUser {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new ApiError(401, "Authentication required");
  }

  try {
    const payload = verifyAccessToken(header.slice("Bearer ".length));
    return { id: payload.sub, email: payload.email, role: payload.role };
  } catch {
    throw new ApiError(401, "Invalid or expired session");
  }
}

/**
 * Returns the caller when a valid bearer token is present, and null
 * otherwise — for endpoints usable by both guests and signed-in users (e.g.
 * gift card purchases) where being logged in only adds attribution.
 */
export function attachUserIfPresent(req: NextRequest): AuthenticatedUser | null {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;

  try {
    const payload = verifyAccessToken(header.slice("Bearer ".length));
    return { id: payload.sub, email: payload.email, role: payload.role };
  } catch {
    // Invalid/expired token on an optional-auth route — proceed as guest.
    return null;
  }
}

export function requireRole(req: NextRequest, ...roles: Role[]): AuthenticatedUser {
  const user = requireAuth(req);
  if (!roles.includes(user.role)) {
    throw new ApiError(403, "You do not have permission to perform this action");
  }
  return user;
}
