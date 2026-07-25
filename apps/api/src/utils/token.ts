import crypto from "crypto";

/**
 * Generates a bearer token for email-verification / password-reset links.
 * Only the SHA-256 hash is ever persisted — a raw DB leak can't be used to
 * impersonate a reset/verification link, same principle as password hashing.
 */
export function generateBearerToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(32).toString("hex");
  const hash = hashToken(token);
  return { token, hash };
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
