import "server-only";
import { z } from "zod";

/**
 * Server-side environment contract for the API routes under /api/v1.
 *
 * Unlike the old standalone Express service, this is parsed lazily rather
 * than at module load: Next.js imports server modules during `next build`
 * (for route collection and static analysis), and a build machine has no
 * reason to hold production database credentials. Throwing at import time
 * would break the build; throwing on first request keeps the same
 * fail-fast-and-loudly behavior where it actually matters.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),

  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  // Mongo puts the database name in the connection string, but Atlas's
  // "connect" dialog hands out a URI without one — this is the fallback so a
  // pasted-as-is Atlas URI still lands in the right database instead of
  // silently using "test".
  MONGODB_DB: z.string().default("zylix"),

  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  TWO_FACTOR_ISSUER: z.string().default("ZylixStore"),

  SETUP_SECRET: z.string().optional(),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  FLUTTERWAVE_PUBLIC_KEY: z.string().optional(),
  FLUTTERWAVE_SECRET_KEY: z.string().optional(),
  FLUTTERWAVE_ENCRYPTION_KEY: z.string().optional(),
  FLUTTERWAVE_WEBHOOK_SECRET_HASH: z.string().optional(),
  PAYSTACK_PUBLIC_KEY: z.string().optional(),
  PAYSTACK_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLIC_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),

  DEFAULT_CURRENCY: z.string().default("NGN"),
  DEFAULT_LOCALE: z.string().default("en"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables — check .env against .env.example");
  }

  cached = parsed.data;
  return cached;
}

/**
 * Proxy so call sites can keep writing `env.JWT_ACCESS_SECRET` (as they did
 * against the Express service's eagerly-parsed export) while the underlying
 * parse still happens on first property access, not on import.
 */
export const env = new Proxy({} as Env, {
  get: (_target, prop: string) => getEnv()[prop as keyof Env],
});
