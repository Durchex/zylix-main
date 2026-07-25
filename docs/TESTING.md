# ZYLIX — Testing Strategy

**Version:** 1.0
**Status:** Milestone 12 of 13
**Depends on:** [API.md](./API.md), [PAYMENTS.md](./PAYMENTS.md), [AUTHENTICATION.md](./AUTHENTICATION.md)

This document covers what is tested, how, and — honestly — what could not be tested in this sandbox and why. No live Postgres or Docker daemon is available in this environment (a constraint noted since Milestone 4), so "integration" here means real Express routes hit through `supertest` against a fully mocked Prisma client, not a real database.

---

## 1. Backend (`apps/api`)

**127 tests across 23 suites**, run with `jest --runInBand --ci` (in-band to avoid flakiness from parallel workers sharing mocked module state in this sandbox).

| Layer | What's covered | How |
|---|---|---|
| Services | Business logic: validation, ownership checks, stock math, price recalculation, wallet debits | `jest.mock("@/lib/prisma", ...)` with typed mock casts; each method's success path, not-found path, and permission-denied path |
| Routes | Full request lifecycle — auth middleware, Zod validation, controller, JSON shape of the response | `supertest` against the real Express app with mocked Prisma |
| Middleware | `requireAuth`, `requireRole`, `requireSeller`, `attachUserIfPresent` — token presence/absence, expired tokens, wrong role | Direct middleware invocation with mock `req`/`res`/`next` |
| RBAC | Admin-only and seller-only routes reject the wrong role/ownership with 403, not just 401 | `admin.rbac.test.ts`, `seller.rbac.test.ts` sweep every protected route in each router |
| Payments | Flutterwave/Paystack/Wallet provider `initiate`/`verify`, webhook signature verification, `confirmPayment` idempotency and re-verification-before-trust | Mocked `fetch` per provider's real response shape; webhook tests construct real signatures (HMAC-SHA512 for Paystack, static hash for Flutterwave) so the verification code path is genuinely exercised, not bypassed |
| Sanitization | `sanitizeHtml` strips script tags/event handlers from blog content while preserving safe formatting | Direct unit tests against known-bad payloads |

**Known gap:** no `stripe.provider.test.ts` yet — Stripe's provider is exercised indirectly through `order.service.test.ts`'s provider-registry tests, but lacks the same dedicated `initiate`/`verify` coverage Flutterwave and Paystack have. Tracked as a remaining task, not silently dropped.

## 2. Frontend (`apps/web`)

**55 tests across 10 suites**, run with `jest --runInBand --ci` and `@testing-library/react`.

| Area | What's covered |
|---|---|
| State stores | `cart.store` (12 tests: merge/cap/remove/setQuantity/subtotal math), `wishlist.store` (4), `compare.store` (6, including the 4-item cap), `auth.store` (from Milestone 6) |
| UI primitives | `Button` (loading/disabled states), `Rating`, `Dialog` (open/close, Escape key, backdrop click, focus handling, body-scroll lock), `Accordion` (single-open-at-a-time behavior) |
| Utilities | `cn()` (Tailwind class merging/conflict resolution), `formatPrice()` (NGN currency formatting, string/number input), `api-client` (401-refresh-retry logic from Milestone 6) |

**Known gap:** this suite covers shared primitives and state, not full page-level rendering (e.g. no test renders the full checkout flow or product listing page end-to-end). Next.js App Router Server Components make that expensive to unit-test meaningfully without a running server; page-level correctness for this milestone was instead verified by driving the actual dev server through the browser preview during Milestones 7–11 (documented per-milestone in `PROGRESS.md`), not automated here.

## 3. What could not be tested in this sandbox

Documented honestly rather than glossed over:

- **No live database.** Every "integration" test uses a mocked Prisma client. Prisma schema correctness (migrations actually applying, foreign key constraints, unique constraints firing) has never been verified against a real Postgres instance in this environment — only `prisma validate` / `prisma generate` have run successfully.
- **No live payment provider calls.** Flutterwave, Paystack, and Stripe integrations have never received a real API key or processed a real transaction. All provider tests mock `fetch`/the Stripe SDK's response shape based on each provider's published API docs. The code is structured to work against the real APIs the moment credentials are added, but that has not been empirically confirmed here.
- **No Docker/container testing.** The `Dockerfile`s (from Milestone 4's folder structure) have not been built or run — no Docker daemon is available in this sandbox.
- **No load, accessibility-audit, or visual-regression testing.** Accessibility was addressed at the component level (ARIA roles/labels on `Dialog`, `Accordion`, focus handling) and spot-checked through the browser preview, but no automated axe-core or Lighthouse run was performed.
- **No email/SMS delivery testing.** Notification-sending code paths (order confirmation, password reset) are covered at the unit level for "was the send function called with the right arguments," not for whether a real message was ever delivered, since no real provider credentials exist here.

## 4. Running the suites

```bash
# Backend
cd apps/api && npm run lint && npx tsc --noEmit && npx jest --ci --runInBand

# Frontend
cd apps/web && npm run lint && npx tsc --noEmit && npx jest --ci --runInBand
```

Both apps are lint-clean (`eslint --max-warnings=0`) and type-clean (`tsc --noEmit`) as of this milestone.
