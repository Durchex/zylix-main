import "server-only";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Generates a bearer token for email-verification / password-reset links.
 * Only the SHA-256 hash is ever persisted — a raw DB leak can't be used to
 * impersonate a reset/verification link, same principle as password hashing.
 */
export function generateBearerToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(32).toString("hex");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
