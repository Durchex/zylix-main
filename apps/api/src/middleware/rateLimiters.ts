import rateLimit from "express-rate-limit";
import { env } from "@/config/env";

// Rate limiting is disabled under test so supertest suites (which fire many
// requests at the same endpoints from the same IP) aren't flaky.
const skipInTests = () => env.NODE_ENV === "test";

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: { error: { message: "Too many attempts. Please try again later." } },
});

export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: { error: { message: "Too many attempts. Please try again later." } },
});

// Applies to unauthenticated public forms (contact, gift-card purchase) that
// would otherwise be an open spam/abuse vector.
export const publicFormRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: { error: { message: "Too many submissions. Please try again later." } },
});
