import "server-only";
import { getEnv } from "@/server/config/env";

/**
 * The public origin of the site, for URLs handed to third parties — the page a
 * payment provider sends the customer back to, and the callback it posts to.
 *
 * APP_URL is the source of truth, but it defaults to http://localhost:3000 when
 * it isn't set. That default is fine in development and disastrous in
 * production: the customer would pay, then be redirected to localhost, and the
 * provider's callbacks would go nowhere. So when the configured value is that
 * local default *in production*, the origin of the request actually being
 * served is used instead — it's the host the customer is on right now, so it's
 * correct by construction.
 */
export function resolvePublicBaseUrl(requestOrigin?: string): string {
  const env = getEnv();
  const configured = env.APP_URL.replace(/\/+$/, "");
  const isLocalDefault = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configured);

  if (env.NODE_ENV === "production" && isLocalDefault && requestOrigin) {
    return requestOrigin.replace(/\/+$/, "");
  }
  return configured;
}
