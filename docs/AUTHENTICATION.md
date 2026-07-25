# ZYLIX — Authentication Architecture

**Version:** 1.0
**Status:** Complete — Milestone 6 of 13
**Depends on:** [DATABASE.md](./DATABASE.md), [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md)

---

## 1. Token Model

- **Access token** — short-lived JWT (15 min default), signed with `JWT_ACCESS_SECRET`. Returned in the JSON response body and held **only in memory** (Zustand store on the client) — never written to `localStorage` or a readable cookie, to limit XSS blast radius. Sent as `Authorization: Bearer <token>`.
- **Refresh token** — longer-lived JWT (30 days default), signed with `JWT_REFRESH_SECRET`. Set as an **httpOnly, `SameSite=Lax`** cookie (`zylix_rt`), scoped to `/api/v1/auth`. Never readable by JavaScript. Each refresh token's `jti` is also persisted (hashed, via `RefreshToken.tokenHash`) in Postgres so a token can be revoked server-side (logout, password reset, admin action) even though the JWT itself remains cryptographically valid until expiry.
- **Rotation** — every call to `/auth/refresh` revokes the presented refresh token and issues a brand new access+refresh pair. A stolen refresh token that gets used is invalidated the moment the legitimate client also tries to use it (both parties would present the same now-revoked token), which surfaces token theft rather than granting silent indefinite access.

## 2. Same-Origin Proxy (why there's no CORS dance in the browser)

`apps/web/next.config.mjs` rewrites `/api/*` to the Express API (`API_URL`, default `http://localhost:4000`). The browser only ever talks to the Next.js origin. This matters specifically because of the httpOnly refresh cookie:

- If the browser called the API's origin directly (`localhost:4000`), the cookie would be scoped to `localhost:4000` and **invisible to Next.js middleware** running on `localhost:3000` — cookie scoping is per-origin, including port.
- With the rewrite, Express's `Set-Cookie` response header is relayed back to the browser as if it came from the Next.js origin (because that's the origin the browser actually connected to), so the cookie is scoped to `localhost:3000` (or the production domain) and is visible to `src/middleware.ts`.
- This also means the browser flow needs no CORS configuration at all. The API's `cors()` middleware (scoped to `APP_URL`, `credentials: true`) exists for direct API access (Postman, mobile clients, admin tooling later), not for the browser SPA flow.

## 3. Route-Protection Layers

Two independent layers, deliberately redundant:

1. **Edge (soft) — `apps/web/src/middleware.ts`.** Checks only for the *presence* of the `zylix_rt` cookie on `/account`, `/seller`, `/admin` and redirects to `/auth/login?next=<path>` if absent. Middleware cannot verify a JWT signature against a secret at the edge in this setup, so this is a fast, cheap UX redirect — not the security boundary.
2. **Client (hard) — `AuthGuard` (`src/components/providers/AuthGuard.tsx`).** Reacts to `SessionProvider`'s resolved auth status (populated by a silent `POST /auth/refresh` on every page load using the httpOnly cookie). Covers the case the edge check can't: a cookie that exists but is expired/revoked. Redirects client-side once the real status is known.
3. **API (real) — `requireAuth` / `requireRole` middleware.** Every protected API route verifies the access token's signature and expiry server-side and attaches `req.user`. This is the actual security boundary; the two layers above are UX conveniences on top of it, not replacements for it.

## 4. Two-Factor Authentication (TOTP)

- `POST /auth/2fa/setup` generates a TOTP secret (`otplib`) and a QR code (`qrcode`, as a data URL) for the user to scan into an authenticator app. The secret is stored on `User.twoFactorSecret` but `twoFactorEnabled` stays `false` until confirmed.
- `POST /auth/2fa/confirm` verifies a submitted code against the stored secret; on success sets `twoFactorEnabled = true` and issues 8 single-use backup codes (shown once, stored hashed via SHA-256 — same principle as password hashing: a DB leak shouldn't let an attacker use them).
- `POST /auth/2fa/disable` requires the account password (not just being logged in) before clearing 2FA state — prevents a hijacked-but-unlocked session from silently turning off the account's second factor.
- Login (`POST /auth/login`) returns `{ requiresTwoFactor: true }` instead of a session when the account has 2FA enabled and no code was submitted; the frontend then re-submits the same credentials plus the 6-digit code.

## 5. Password & Token Hashing

- Passwords: `bcryptjs`, 12 salt rounds.
- Email-verification and password-reset links: a random 32-byte token is emailed to the user, but only its SHA-256 hash is persisted (`User.emailVerificationTokenHash` / `passwordResetTokenHash`, each with a paired expiry). A stolen database dump cannot be used to mint valid reset links.
- Password reset also calls `logoutAll()` — every existing refresh token for that user is revoked, forcing re-authentication on all devices after a credential change.
- `forgotPassword` always responds identically regardless of whether the email exists, to avoid user enumeration.

## 6. Rate Limiting

`authRateLimiter` (10 requests / 15 min) applies to `/auth/register` and `/auth/login`; `passwordResetRateLimiter` (5 / hour) applies to `/auth/forgot-password`. Both are skipped when `NODE_ENV === "test"` so the automated test suite (which legitimately fires many requests at the same endpoint) isn't flaky.

## 7. Endpoint Reference

| Method | Path | Auth required | Notes |
|---|---|---|---|
| POST | `/api/v1/auth/register` | No | Creates user + starter `Cart`/`Wishlist`/`Wallet`/`ReferralCode` in one transaction |
| POST | `/api/v1/auth/login` | No | May return `{ requiresTwoFactor: true }` |
| POST | `/api/v1/auth/refresh` | Cookie only | Rotates the refresh token |
| POST | `/api/v1/auth/logout` | Cookie only | Idempotent |
| POST | `/api/v1/auth/logout-all` | Bearer | Revokes every refresh token for the account (sign out everywhere) |
| GET | `/api/v1/auth/me` | Bearer | Returns the sanitized current user |
| POST | `/api/v1/auth/forgot-password` | No | Always 200 |
| POST | `/api/v1/auth/reset-password` | No | Token from email |
| POST | `/api/v1/auth/verify-email` | No | Token from email |
| POST | `/api/v1/auth/resend-verification` | Bearer | |
| POST | `/api/v1/auth/2fa/setup` | Bearer | |
| POST | `/api/v1/auth/2fa/confirm` | Bearer | |
| POST | `/api/v1/auth/2fa/disable` | Bearer | Requires password in body |

---

**Approval required to proceed to Milestone 7: Frontend Pages.**
