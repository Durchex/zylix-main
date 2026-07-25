import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "@/utils/jwt";
import { ApiError } from "@/middleware/errorHandler";
import { prisma } from "@/lib/prisma";
import type { Role, SellerStatus } from "@prisma/client";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}

export interface AuthenticatedSeller {
  id: string;
  status: SellerStatus;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      seller?: AuthenticatedSeller;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new ApiError(401, "Authentication required");
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch {
    throw new ApiError(401, "Invalid or expired session");
  }
}

/**
 * Attaches req.user when a valid bearer token is present, but never rejects
 * the request — for endpoints usable by both guests and signed-in users
 * (e.g. gift card purchases) where being logged in only adds attribution.
 */
export function attachUserIfPresent(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      const payload = verifyAccessToken(header.slice("Bearer ".length));
      req.user = { id: payload.sub, email: payload.email, role: payload.role };
    } catch {
      // Invalid/expired token on an optional-auth route — proceed as guest.
    }
  }
  next();
}

/**
 * For /seller/* routes: confirms the authenticated user has a Seller
 * profile and attaches it to req.seller so handlers can scope every query
 * to `sellerId: req.seller.id` without re-fetching it themselves. Does NOT
 * require `status: APPROVED` — a pending applicant still needs to reach
 * their dashboard to see their application status.
 */
export async function requireSeller(req: Request, _res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }
    const seller = await prisma.seller.findUnique({
      where: { userId: req.user.id },
      select: { id: true, status: true },
    });
    if (!seller) {
      throw new ApiError(404, "No seller profile found for this account");
    }
    req.seller = seller;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, "You do not have permission to perform this action");
    }
    next();
  };
}
