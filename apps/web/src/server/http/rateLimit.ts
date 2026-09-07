import "server-only";
import { Schema, type Types } from "mongoose";
import type { NextRequest } from "next/server";
import { baseSchemaOptions, defineModel } from "@/server/models/base";
import { getEnv } from "@/server/config/env";
import { ApiError } from "./errors";
import { clientIp } from "./route";

/**
 * express-rate-limit kept its counters in the process's memory, which worked
 * because there was exactly one long-lived Express process. On Vercel each
 * request may hit a different lambda instance, so an in-memory counter would
 * reset constantly and enforce nothing — an attacker gets the full limit per
 * instance. Redis was the usual fix; with it dropped, the counters live in
 * Mongo, which every instance already shares.
 */
interface RateLimitDoc {
  _id: Types.ObjectId;
  key: string;
  count: number;
  expiresAt: Date;
}

const rateLimitSchema = new Schema<RateLimitDoc>(
  {
    key: { type: String, required: true, unique: true },
    count: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  baseSchemaOptions,
);

// Mongo reclaims each window's document once it lapses, so the collection
// stays bounded with no sweep job of its own.
rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RateLimitCounter = defineModel<RateLimitDoc>("RateLimitCounter", rateLimitSchema);

interface RateLimitOptions {
  /** Window length in milliseconds. */
  windowMs: number;
  /** Requests permitted per window, per key. */
  limit: number;
  /** Distinguishes one limiter's counters from another's. */
  name: string;
  message?: string;
}

/**
 * Fixed-window counter. A single findOneAndUpdate does the increment, so two
 * concurrent requests can't both read the same count and each decide they're
 * under the limit.
 */
export async function enforceRateLimit(
  req: NextRequest,
  { windowMs, limit, name, message }: RateLimitOptions,
): Promise<void> {
  // Kept off in tests so suites that legitimately fire many requests at one
  // endpoint aren't flaky — same carve-out the Express limiters had.
  if (getEnv().NODE_ENV === "test") return;

  const now = Date.now();
  // Truncating to the window start means every instance derives the same
  // bucket for the same moment without coordinating.
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const key = `${name}:${clientIp(req)}:${windowStart}`;

  let doc: RateLimitDoc | null;
  try {
    doc = await RateLimitCounter.findOneAndUpdate(
      { key },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(windowStart + windowMs) } },
      { upsert: true, new: true },
    ).lean();
  } catch {
    // Never let the limiter's own failure take down the endpoint it guards —
    // an unavailable counter should degrade to "allowed", not to a 500 on
    // login for every user.
    return;
  }

  if (doc && doc.count > limit) {
    throw new ApiError(429, message ?? "Too many attempts. Please try again later.");
  }
}

/** 10 requests / 15 min — /auth/register and /auth/login. */
export const authRateLimit = {
  name: "auth",
  windowMs: 15 * 60 * 1000,
  limit: 10,
} satisfies RateLimitOptions;

/** 5 / hour — /auth/forgot-password. */
export const passwordResetRateLimit = {
  name: "password-reset",
  windowMs: 60 * 60 * 1000,
  limit: 5,
} satisfies RateLimitOptions;

/**
 * 10 / hour — unauthenticated public forms (contact, gift-card purchase)
 * that would otherwise be an open spam/abuse vector.
 */
export const publicFormRateLimit = {
  name: "public-form",
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message: "Too many submissions. Please try again later.",
} satisfies RateLimitOptions;

/** 300 / 15 min — the global ceiling the Express app applied to every route. */
export const globalRateLimit = {
  name: "global",
  windowMs: 15 * 60 * 1000,
  limit: 300,
} satisfies RateLimitOptions;
