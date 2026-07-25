# ZYLIX — Build Progress Checklist

Live tracker, updated after every completed feature/milestone. Also reflected in the live preview at `/` (home page) until Milestone 7 replaces it with the real storefront.

## Milestones

- [x] **1. PRD** — [docs/PRD.md](./PRD.md)
- [x] **2. Sitemap & User Flows** — [docs/SITEMAP.md](./SITEMAP.md)
- [x] **3. Database & Prisma Schema** — [docs/DATABASE.md](./DATABASE.md)
- [x] **4. Folder Structure** — [docs/FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md)
- [x] **5. UI Design System** — [docs/DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
- [x] **6. Authentication** — [docs/AUTHENTICATION.md](./AUTHENTICATION.md)
- [x] **7. Frontend Pages** — Home, Shop/Category/Subcategory, PDP, Cart, Wishlist, Compare, Search, Deals, New Arrivals, Blog, Support (+FAQ/Contact/Order Tracking/Returns), Legal pages, About, Brands, Gift Cards, Referral, Newsletter unsubscribe, Checkout shell
- [x] **8. Backend APIs** — [docs/API.md](./API.md)
- [x] **9. Admin Dashboard** — layout/RBAC, dashboard, Catalog, Orders, Sellers/approval, Users, Blog CMS, Audit Log shipped; Roles/Payments/Fraud/Marketing/CMS-pages/SEO/Analytics/Settings deliberately deferred (not blocking — noted in Part 2 detail below)
- [x] **10. Seller Dashboard** — onboarding, seller-scoped RBAC, dashboard, product CRUD, order fulfillment shipped; bulk upload/inventory/payouts/analytics/reviews/settings deferred (see detail below)
- [x] **11. Payment Integration** — [docs/PAYMENTS.md](./PAYMENTS.md)
- [x] **12. Testing** — [docs/TESTING.md](./TESTING.md)
- [x] **13. Deployment** — [docs/DEPLOYMENT.md](./DEPLOYMENT.md)

## Milestone 4 detail — Folder Structure

**Completed features**
- npm workspaces monorepo (`apps/web`, `apps/api`) wired to a single root install/build/dev pipeline.
- `apps/web`: Next.js 16.2.10 (App Router, Turbopack dev) + TypeScript (strict) + Tailwind, ESLint 9 flat config, root layout with a real `Footer` component (renders "Powered by Durchex D.A.M Company LTD" on every page).
- `apps/api`: Express 4 + TypeScript, Zod-validated env config, Prisma client singleton, ioredis client, Winston logger, centralized error handler (`ApiError`, 404/500 handlers), security middleware (helmet, cors scoped to `APP_URL`, rate limiting, compression), graceful shutdown on SIGINT/SIGTERM.
- `GET /api/v1/health` — real endpoint checking Postgres and Redis connectivity with a bounded 2s timeout per dependency (fails fast instead of hanging).
- Prisma schema (Milestone 3) placed at `apps/api/prisma/schema.prisma`; client generates successfully.
- `docker-compose.yml` for local Postgres 16 + Redis 7.
- `.env` / `.env.example` covering every credential the PRD's tech stack needs (DB, Redis, JWT, Cloudinary, Flutterwave/Paystack/Stripe/PayPal/Apple/Google Pay).

**Tests written**
- None yet — Milestone 4 is infrastructure, not feature logic. Test *tooling* is wired (`jest` + `@testing-library/react` for web, `jest` + `supertest` for api) so Milestone 6 onward can add real unit/integration tests immediately. Formal test-suite build-out is Milestone 12.

**Verification performed**
- `tsc --noEmit` passes with zero errors on both `apps/web` and `apps/api`.
- `eslint` passes with zero errors/warnings on both apps.
- `npm audit`: 0 high/critical vulnerabilities in our direct dependency tree (upgraded Next.js 14→16.2.10 after audit flagged 4 high-severity advisories in 14.x). One moderate advisory remains, in a PostCSS copy bundled *internally* by Next.js's own build tooling (not our direct postcss dependency, which is patched) — no real fix exists short of Next.js's next release; tracked as an accepted, monitored risk.
- API dev server boots and `/api/v1/health` correctly returns `503 degraded` with `database: error, redis: error` when Postgres/Redis aren't running (no Docker daemon in this dev sandbox) — confirms fail-fast behavior rather than hanging, and confirms the endpoint itself works end-to-end.
- Web dev server boots on Turbopack; live-previewed in browser — Zylix branding, dark theme, milestone tracker, and footer all render correctly.

**Potential risks**
- Local dev requires Docker (or manually installed Postgres/Redis) for the API to report fully healthy — not exercised in this sandbox since Docker isn't available here. You'll want to run `docker compose up -d` on your own machine before Milestone 6+ (Auth) needs a real database.
- Residual moderate npm advisory (bundled PostCSS inside Next.js's toolchain) — no action possible until Next.js patches it upstream; re-check on each future `npm audit`.
- Brand colors in `tailwind.config.ts` (`zylix.gold` etc.) are a placeholder palette pending Milestone 5's real design system — expect these hex values to change.

**Remaining tasks**
- Milestone 5 onward, per the roadmap above.

## Milestone 5 detail — UI Design System

**Completed features**
- Full color token system (`brand`, `ink`, `neutral`, semantic `success/warning/error/info`) in `tailwind.config.ts`, replacing the Milestone 4 placeholder palette.
- Inter typeface wired via `next/font/google`, exposed as `--font-sans`.
- 14 production UI components in `src/components/ui/`: `Button`, `Badge`, `Card` (+Header/Body/Footer), `Input`, `Textarea`, `Select`, `Checkbox`, `Label`, `Rating`, `PriceTag`, `Avatar`, `Alert`, `Skeleton`, `Dialog`, `Container`, `Spinner` — all variant-driven via `class-variance-authority`.
- `Logo` and refreshed `Footer` components (footer still renders "Powered by Durchex D.A.M Company LTD" on every page).
- Live `/style-guide` reference page showing every component in its real, running state — doubles as the visual QA surface for this milestone and a lasting internal reference for Milestones 7, 9, 10.
- Jest test tooling fully wired via `next/jest` (`jest.config.js`, `jest.setup.ts`).

**Tests written**
- `Button.test.tsx` (4 tests): renders children, fires `onClick`, disabled+`aria-busy` while loading, no `onClick` when disabled.
- `Rating.test.tsx` (3 tests): accessible `role="img"` label reflects the numeric value, review count renders, count omitted when not provided.
- 7/7 passing.

**Verification performed**
- `tsc --noEmit`: clean on `apps/web`.
- `eslint`: clean, 0 errors/0 warnings (after fixing 2 real warnings, see below).
- `jest`: 2 suites / 7 tests passing.
- Live browser verification: home page and `/style-guide` visually inspected end-to-end (color swatches, typography scale, all 5 button variants + loading/disabled states, all 6 badge variants, form controls, star rating incl. half-star, NGN price formatting, avatars, alerts, cards, skeletons); `Dialog` open/close interaction tested by click.
- Confirmed footer ("Powered by Durchex D.A.M Company LTD") present in the DOM on both pages.

**Bugs found and fixed**
1. Accessibility bug: loading `Spinner`'s `aria-label` was leaking into `Button`'s accessible name ("Loading Submitting" instead of "Submitting"). Fixed via `aria-hidden` on the icon.
2. ESLint config bug: `eslint.config.mjs` used the legacy `FlatCompat` shim, which crashed (`Converting circular structure to JSON`) against `eslint-config-next@16`'s native flat config. Fixed by importing the flat config directly; removed the now-unneeded `@eslint/eslintrc` dependency.
3. Duplicate SVG gradient ID bug in `Rating`'s half-star rendering — would break on any page with multiple ratings (i.e. every product grid). Fixed with `useId()`-scoped unique IDs.
4. Stale color classes: Milestone 4's placeholder home page and `Footer` still referenced the old ad-hoc `zylix-*` classes removed by this milestone's real palette — migrated both to the new tokens.

Full detail in [docs/DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md).

**Potential risks**
- Brand palette/wordmark are original-but-provisional pending any professional brand kit the business commissions later — low blast radius since every component consumes tokens, not hardcoded colors.
- `Dialog` has focus-return on close but not a full internal focus trap (Tab doesn't loop yet) — flagged for hardening when Milestone 6 builds auth modals on top of it.

**Remaining tasks**
- Milestone 6 onward, per the roadmap above.

## Milestone 6 detail — Authentication

**Completed features**
- JWT access tokens (15 min, in-memory only on the client) + httpOnly `SameSite=Lax` refresh-token cookie with server-side rotation and revocation (`RefreshToken` table, hashed at rest).
- Full auth API: register, login (+2FA challenge), refresh, logout, logout-all, `/me`, forgot/reset password, verify/resend-verification email, 2FA setup/confirm/disable.
- bcrypt password hashing (12 rounds); email-verification and password-reset tokens are random 32-byte bearer tokens, only their SHA-256 hash persisted.
- TOTP 2FA via `otplib` + QR provisioning via `qrcode`; 8 single-use hashed backup codes issued on enable.
- RBAC middleware (`requireAuth`, `requireRole`) enforced at the API — the real security boundary.
- Rate limiting on register/login (10/15min) and password reset (5/hour), auto-skipped under `NODE_ENV=test`.
- Next.js rewrite proxy (`/api/*` → Express) so the refresh cookie is same-origin to the web app — no CORS needed for the browser flow, and `middleware.ts` can see the cookie.
- Two-layer route protection: edge cookie-presence redirect (`middleware.ts`) + client `AuthGuard` reacting to real session status (`SessionProvider` silently calls `/auth/refresh` on every load).
- Frontend pages: `/auth/register`, `/auth/login` (2FA-aware), `/auth/forgot-password`, `/auth/reset-password/[token]`, `/auth/verify-email/[token]`, `/account` (overview + logout), `/account/security` (2FA setup/disable UI with QR + backup codes).
- Zustand `useAuthStore` + `apiRequest` fetch wrapper with transparent 401 → refresh → retry.

**Tests written**
- API: 22 tests across `auth.service.test.ts` (9), `auth.routes.test.ts` (7, via supertest with mocked Prisma), `middleware/auth.test.ts` (6).
- Web: 8 tests across `auth.store.test.ts` (3) and `api-client.test.ts` (5, including the 401-refresh-retry flow).
- 30/30 passing.

**Verification performed**
- `tsc --noEmit` and `eslint`: clean on both apps.
- Full Jest suites green on both apps (re-run after fixes, see below).
- Live browser verification: `/auth/register` and `/auth/login` render correctly with design-system styling; submitting a weak password correctly blocks submission with the zod error message; a valid submission reaches `POST /api/v1/auth/register` through the Next.js rewrite proxy and surfaces the API's response in the UI; `/account` correctly redirects an unauthenticated visitor to `/auth/login` via the edge middleware; `GET /api/v1/health` correctly reports `503 degraded` (no Postgres/Redis available in this sandbox — expected, confirms fail-fast behavior rather than a hang).
- **Not exercised live:** a full successful registration/login round-trip against a real database, since this sandbox has no Docker/Postgres. Unit/integration tests cover this logic with a mocked Prisma client; a full live pass is recommended once you run `docker compose up -d` locally.

**Bugs found and fixed**
1. `noUncheckedIndexedAccess` (enabled repo-wide) flagged every mocked-Prisma property access in the two backend test files, because the mocks were typed with `Record<string, jest.Mock>` index signatures. Fixed by typing the mocks with explicit method names instead.
2. An unused, half-written `test-utils/mockPrisma.ts` helper (superseded by inlining the mocks per-file) had its own type errors and was never imported anywhere — deleted rather than fixed, since it was dead code.
3. A flaky test run under full parallel Jest workers (one test hit the default 5s timeout) turned out to be resource contention in this sandbox, not a real bug — confirmed by an isolated re-run passing in under a second per test. Addressed defensively by raising `testTimeout` to 20s for `apps/api`, appropriate given this environment's demonstrated latency variance.

**Potential risks**
- No live database round-trip tested in this sandbox — do this locally before relying on Milestone 6 in a real deploy.
- `Dialog`'s partial focus-trap limitation (flagged in Milestone 5) doesn't apply here — the 2FA/auth flows use full pages, not modals.
- Refresh-cookie `SameSite=Lax` (not `Strict`) is a deliberate compatibility tradeoff; revisit if a stricter CSRF posture is later required.

**Remaining tasks**
- Milestone 7 onward, per the roadmap above.

## Milestone 7 detail — Frontend Pages (Part 1: core shopping experience)

The full Milestone 7 scope (per [docs/SITEMAP.md](./SITEMAP.md)) is ~20 page types. This pass covers the shopping core; Blog, Support/FAQ/Contact/Returns/Order Tracking, Legal pages, Brands, Gift Cards, Referral, Newsletter unsubscribe, and Checkout are tracked as remaining work below.

**Completed features**
- Site `Header` (logo, category nav, search bar routing to `/search`, wishlist/cart icon badges, mobile menu) — the shared layout piece missing since Milestone 5.
- Server-rendered (SEO-first) pages: Home, `/shop`, `/shop/[category]`, `/shop/[category]/[subcategory]`, `/new-arrivals`, `/deals`, `/products/[slug]` (with `Product` JSON-LD structured data, dynamic Open Graph metadata, `notFound()` handling).
- URL-driven `FilterSidebar` (sort, category, featured) — filters are query params, so filtered views are shareable/bookmarkable and each change triggers a fresh server render, not client-side re-fetching.
- Client-side stores for cart/wishlist/compare (`zustand` + `persist`, localStorage-backed) — genuinely functional now (add/remove/adjust quantity, persists across reloads) independent of Milestone 8's backend; will be reconciled with server-side `Cart`/`Wishlist` persistence once those endpoints exist.
- `/cart` (full line-item management), `/wishlist` and `/compare` (client-fetched by ID once Milestone 8 ships the `/products` endpoint; render correct empty states today).
- `serverApiRequest` — a `server-only` fetch helper so catalog pages are true Server Components (Core Web Vitals / SEO), separate from the browser-oriented `apiRequest` used by Milestone 6's auth flows and the client-side cart/wishlist pages.
- Shared `ProductCard` / `ProductGrid` (+ skeleton/empty states) used across every listing page.

**Tests written**
- None new this pass — these are composition/integration pages built from Milestone 5's already-tested UI primitives and Milestone 6's already-tested `apiRequest`. Meaningful tests here need real product data, i.e. Milestone 8's API + Milestone 12's suite; premature to write now against a backend that doesn't exist yet.

**Verification performed**
- `tsc --noEmit` and `eslint`: clean on `apps/web`.
- Live browser verification: Home, `/shop` (incl. clicking a category checkbox and confirming the URL updates to `?category=smartphones` and triggers a fresh RSC request — filter architecture confirmed working end-to-end), `/products/test-slug` (confirmed graceful `404` via `notFound()`), `/cart`, `/wishlist`, `/compare` all render their correct empty states with zero console errors. Every page correctly shows "catalog coming soon" / "no products" messaging rather than crashing, since Milestone 8's `/products` API doesn't exist yet — this is the same intentional frontend-before-backend sequencing already established in the roadmap and precedented by Milestone 6's auth pages before Postgres was available.

**Bugs found and fixed**
1. `react-hooks/set-state-in-effect` (a real footgun, not just a lint nag): `/wishlist` and `/compare` called `setState` synchronously inside `useEffect` for the trivial "no IDs" case, which can cascade an extra render. Fixed by handling that case directly in the render branch instead of via effect+state.
2. `noUncheckedIndexedAccess` rejected passing the closed `ProductListParams` interface into a `Record<string, unknown>`-typed helper — fixed by typing `buildQuery`'s parameter as `object` and narrowing internally, rather than fighting the structural-typing rule with generics (which doesn't actually satisfy it).
3. `ProductDetail` was missing `seoTitle`/`seoDescription` (present on the Prisma `Product` model) — added, since the PDP's `generateMetadata` needs them.
4. Sandbox-specific: a running `tsx watch` dev server holds the Prisma query-engine `.dll.node` file open on Windows, so `npm install`'s `prisma generate` postinstall hook hit `EPERM` mid-install. Not a code bug — stopped the dev server before installing, documenting here since it'll recur for anyone installing new API dependencies while `npm run dev` is running locally on Windows.

**Potential risks**
- Client-side cart/wishlist/compare state is local-only (localStorage) until Milestone 8 adds server-side `Cart`/`Wishlist` persistence — a user switching devices won't see the same cart yet. Expected at this stage of the build, not a regression.
- `/wishlist` and `/compare` assume Milestone 8 will expose `GET /products?ids=...` and `GET /products/by-id/:id` respectively — flagging these exact contracts now so Milestone 8's API design doesn't drift from what the frontend already expects.
- No live product data has been visually verified (no backend yet) — once Milestone 8 ships, do a full pass re-checking image aspect ratios, price formatting, and rating stars against real records.

**Remaining tasks (rest of Milestone 7)** — *superseded, see Part 2 below*

## Milestone 7 detail — Frontend Pages (Part 2: content, support, and checkout)

Completes Milestone 7. Combined with Part 1, all ~37 public storefront pages in [docs/SITEMAP.md](./SITEMAP.md) are now built (excluding the authenticated Customer Dashboard sub-pages beyond `/account` and `/account/security`, which are natural Milestone 8/9 companions once their backing data models — orders, addresses, wallet, rewards — have real endpoints).

**Completed features**
- `/search` — server-rendered, query-param-driven (`?q=`), `noindex` (not meant to rank).
- Blog: `/blog` (listing) and `/blog/[slug]` (post, with `generateMetadata` for SEO + Open Graph). Post HTML is rendered via `dangerouslySetInnerHTML` — flagged inline that this is safe only because the admin CMS editor (Milestone 9) is the sole author of that content and is responsible for sanitizing it before persisting.
- Support Center hub (`/support`) plus `/support/faq` (real `Accordion` component, single-open, fully keyboard/ARIA accessible), `/support/contact` (validated form), `/support/order-tracking` (order number + email lookup), `/support/returns` (informational, links to `/account/returns` and the legal policy).
- 5 legal pages with genuine, Zylix-specific policy text (Privacy, Terms, Shipping, Returns, Cookies) — not boilerplate lorem ipsum, written to reference actual platform specifics (NGN pricing, Africa-first payment providers, Durchex D.A.M as operator, marketplace seller model).
- `/about` — real brand copy.
- `/brands` (seller directory) and `/brands/[brand]` (seller storefront: seller header + their product grid).
- `/gift-cards` — denomination picker + recipient form.
- `/referral` (behind `AuthGuard`) — referral link with copy-to-clipboard, referred-count and rewards-earned stats.
- `/newsletter/unsubscribe` — reads `?email=`, calls the unsubscribe endpoint, shows a clear confirmation.
- Full `/checkout` UI shell: `/checkout` (shipping address form + order summary from the cart store), `/checkout/payment` (Flutterwave/Paystack marked "Recommended" per the PRD's Africa-first decision, Stripe/PayPal/Apple/Google Pay as secondary options, "Place order" posts to `/orders`), `/checkout/confirmation/[orderId]` (server-rendered, `notFound()` for an unknown order).
- Footer rebuilt from a single "Powered by..." line into the full 5-column footer speced in [docs/SITEMAP.md](./SITEMAP.md) §4.2 (Shop / Customer Service / Company / Legal + payment badges), now linking to every page in this milestone.
- **Migrated `middleware.ts` → `proxy.ts`**: Next.js 16 deprecated the `middleware` file convention in favor of `proxy` (same `NextRequest`/`NextResponse` API, just renamed — confirmed via Next's own bundled docs). Caught this from a dev-server warning and fixed it rather than shipping on a deprecated API.

**Tests written**
- None new — same reasoning as Part 1: these are composition pages over already-tested primitives, and the endpoints they call (`/blog`, `/support/contact`, `/sellers`, `/gift-cards`, `/referrals/me`, `/orders`, `/newsletter/unsubscribe`) don't exist until Milestone 8. Documenting the exact contracts each page expects (above, and inline in the code) so Milestone 8's API design and Milestone 12's test suite can target them directly.

**Verification performed**
- `tsc --noEmit` and `eslint`: clean on `apps/web`.
- Live browser verification after restarting both dev servers post a session interruption: `/account` still correctly redirects to `/auth/login` (confirms `proxy.ts` route protection survived the middleware→proxy rename), `/about` and the new footer render correctly, `/legal/privacy-policy` has correct SEO title, `/support/faq`'s accordion opens/closes correctly on click (verified via accessibility tree, not just visually), `/blog` and `/checkout` show their correct empty states. Zero console errors across every page checked.

**Bugs found and fixed**
1. `react-hooks/set-state-in-effect` recurred in `/newsletter/unsubscribe` (same footgun as Part 1's wishlist/compare) — fixed the same way, by deriving the "no email" case at render time instead of via effect+state.
2. Next.js 16 deprecated `middleware.ts` in favor of `proxy.ts` — migrated (see above) rather than leaving a deprecation warning in the dev server output.

**Potential risks**
- Checkout's payment step visually presents all 6 payment methods but doesn't actually call any payment SDK yet — that's exactly Milestone 11's scope. "Place order" today will fail once it reaches a real backend without payment confirmation wired up; this is intentional sequencing, not an oversight.
- Blog post content trusts the backend/CMS to sanitize HTML before storage (stored-XSS risk if that assumption doesn't hold) — worth a dedicated test in Milestone 9 (Admin Dashboard, where the CMS editor is built) or Milestone 12.
- Legal policy text is realistic and specific but is not a substitute for actual legal review before this platform handles real transactions — flagging so it isn't mistaken for legally-vetted copy.

**Remaining tasks**
- Milestone 8 onward, per the roadmap above. The Customer Dashboard sub-pages (`/account/orders`, `/account/wishlist`, `/account/addresses`, `/account/payment-methods`, `/account/wallet`, `/account/rewards`, `/account/coupons`, `/account/notifications`, `/account/settings`) are natural Milestone 8/9 companions once their backing endpoints exist.

## Milestone 8 detail — Backend APIs

Implements every endpoint Milestone 7's frontend pages already call, to the exact contracts documented in that milestone's notes. Full reference in [docs/API.md](./API.md).

**Completed features**
- 9 resource modules (validation → service → controller → routes, same layering as Milestone 6's auth module): Products, Categories, Sellers, Blog, Support/Contact, Orders, Gift Cards, Referrals, Newsletter.
- Products: full filtering (category, seller, brand, search, price range, featured, `ids`, sort), pagination, and a public list/detail/by-id API. Prisma `Decimal` fields are serialized via `.toString()` — never converted to `number` — to avoid floating-point money bugs.
- Orders: `POST /orders` looks up **server-side** prices only (never trusts client-submitted amounts), validates and decrements variant stock, and creates the order/items/initial payment record in a single transaction. `GET /orders/track` (guest lookup) and `GET /orders/:orderId` (deliberately public, minimal-field confirmation endpoint — see security note in API.md) round out the flow.
- New `attachUserIfPresent` middleware — optional-auth variant of `requireAuth`, used where guests and signed-in users share an endpoint (gift card purchases).
- Shared `utils/pagination.ts` so every paginated endpoint returns the identical `{ items, total, page, pageSize, totalPages }` shape the frontend's `PaginatedResult<T>` type expects.
- `publicFormRateLimiter` (10/hour) added for unauthenticated public forms (contact, gift cards) — same spam-prevention reasoning as Milestone 6's auth rate limiters.
- Schema extended with `GiftCard.senderName` / `GiftCard.message` — the Milestone 7 gift-card form already collected these; the schema didn't have them yet.

**Tests written**
- 22 new tests: `product.service.test.ts` (9), `order.service.test.ts` (9), `product.routes.test.ts` (4, including a dedicated regression test for the `/by-id/:id` vs `/:slug` route-ordering hazard), `order.routes.test.ts` (4).
- Combined with Milestone 6's suite: **44/44 passing** across the full `apps/api` test suite.

**Verification performed**
- `tsc --noEmit` and `eslint`: clean on `apps/api` (first pass, no errors on either).
- Full live browser + server-log verification: `/shop`'s server-side fetch was traced through to `product.service.ts:129` in the API's own logs, failing only at the Postgres connection (no DB in this sandbox) — confirms the entire SSR data path works end-to-end. `/support/order-tracking`'s client-side form submission was traced via `read_network_requests`, correctly hitting `GET /api/v1/orders/track?orderNumber=...&email=...` through the Next.js rewrite proxy, with the resulting 500 correctly surfaced in the UI's `Alert` component. Zero console errors.

**Bugs found and fixed**
- None this milestone — both new service test files (14 tests) and both new route test files (8 tests) passed on their first run, and `tsc`/`eslint` were clean on the first pass. Attributed to writing the frontend contracts first (Milestone 7) and implementing strictly to them here, rather than designing the API and frontend against each other's assumptions concurrently.

**Potential risks**
- No live database round-trip tested in this sandbox (same standing caveat since Milestone 4) — run the full flow once against `docker compose up -d` locally.
- `GET /orders/:orderId` is intentionally public (unguessable ID as the bearer secret, minimal fields returned) — documented in API.md so this isn't mistaken for an oversight when `/account/orders/:orderId` is eventually built with real auth checks.
- Referral `totalRewardsEarned` sums *all* earned reward points, not specifically referral-sourced ones, since the schema doesn't tag ledger entries by source — flagged as a possible schema gap in API.md.
- Cart/Wishlist still have no server-side persistence endpoint — Milestone 7's client-only stores are unchanged by this milestone.

**Remaining tasks**
- Milestone 9 onward, per the roadmap above.

## Milestone 9 detail — Admin Dashboard (Part 1: layout/RBAC + Catalog management)

Full Milestone 9 scope per [docs/SITEMAP.md](./SITEMAP.md) is ~26 admin pages across Catalog, Orders, Sellers, Users/Roles, Payments, Fraud, Marketing (5 areas), CMS (2 areas), SEO, Analytics, Settings, and Audit Log. This pass builds the foundational shell every other admin page will sit inside, plus the single most operationally critical capability: the platform needs a way to actually manage what it sells before anything else in the admin panel matters.

**Completed features**
- **Admin layout & RBAC shell**: `/admin/layout.tsx` wraps every admin page in `AuthGuard allowedRoles={["ADMIN"]}` (reusing Milestone 6's guard) plus a persistent sidebar (`AdminSidebar`). The storefront `Header`/`Footer` now hide themselves on `/admin` and `/seller` routes (they'd look wrong wrapped around an internal tool) — replaced with a minimal `AdminFooter` that still carries the required "Powered by Durchex D.A.M Company LTD" line, since that requirement applies to every page, not just the storefront.
- **Dashboard overview** (`/admin`): KPI cards (orders, revenue, products, users, pending seller applications, low-stock variant count) and a recent-orders list, backed by a new `GET /admin/dashboard/stats` endpoint.
- **Full product management**: list (search + status filter + pagination), create, edit, delete — `/admin/catalog/products`, `/admin/catalog/products/new`, `/admin/catalog/products/[id]`, sharing one `ProductForm` component with dynamic image and variant fields (`useFieldArray`). Backend enforces slug/SKU uniqueness on both create and update.
- **Full category management**: list + create/edit via a modal dialog (reusing Milestone 5's `Dialog`) rather than separate pages, since categories have far fewer fields than products. Backend refuses to delete a category that still has products or subcategories attached (data-integrity guard, not just a UI nicety).
- Backend: 9 new admin-scoped files (validation/service/controller × 2 resources + dashboard service/controller + the `/admin` route mount), every route gated by `requireAuth` + `requireRole("ADMIN")` in one place (`routes/admin/index.ts`) rather than per-route, so a future route can't accidentally be added unprotected.

**Tests written**
- 15 new backend tests: `admin/product.service.test.ts` (5 — duplicate slug/SKU rejection, nested create, delete guards), `admin/category.service.test.ts` (6 — duplicate slug, self-parent rejection, delete guards for products/children), `admin.rbac.test.ts` (4 — the security-critical suite: unauthenticated → 401, CUSTOMER → 403, SELLER → 403, ADMIN → passes through).
- Combined total: **59/59 passing** across the full `apps/api` suite.

**Verification performed**
- `tsc --noEmit` and `eslint`: clean on both apps.
- Live browser verification: `/admin` correctly redirects an unauthenticated visitor to `/auth/login` (same `proxy.ts` edge protection as `/account`), zero console errors.
- **Not exercised live**: the authenticated admin UI itself (no way to create an ADMIN-role user without a real Postgres in this sandbox). RBAC enforcement is instead verified at the level that actually matters — the `admin.rbac.test.ts` suite proves the API rejects non-admin roles regardless of what the frontend does, so this isn't a coverage gap so much as the standard sandbox limitation (flagged since Milestone 4) applied to a new area.

**Bugs found and fixed**
1. Same `react-hooks/set-state-in-effect` footgun as Milestones 7 (twice now) — this time indirected through a `load()` helper whose *first* statement was a synchronous `setError(null)` before the async call. Fixed the same way: moved the error-clear into the `.then()` resolution instead of calling it eagerly.
2. A genuine bug in my own test file (`order.service.test.ts`, written last milestone): `(mockPrisma as unknown as Record<string, unknown>).order.create = ...` — casting the whole `mockPrisma` object made `.order` itself `unknown`, so `.order.create` didn't type-check. `tsc --noEmit` caught this on a routine re-check even though the test had been passing at runtime; fixed by casting `mockPrisma.order` specifically, not its parent.

**Potential risks**
- No live database testing (standing sandbox caveat) — verify the full product/category CRUD flow against a real Postgres before relying on it.
- RBAC is currently coarse-grained (`role === ADMIN`) — the schema's `adminPermissions` array (Support/Catalog Manager/Super Admin sub-roles per PRD §5) isn't enforced yet. Fine for a single-operator launch (Durchex-only, per the PRD's confirmed launch decision), but worth adding before onboarding multiple admin staff with different responsibilities.
- Product form's variant/image management is functional but not exhaustively polished (e.g. no drag-to-reorder for images) — acceptable for an admin tool at this stage.

**Remaining tasks (rest of Milestone 9, per Part 1)** — *superseded, see Part 2 below*

## Milestone 9 detail — Admin Dashboard (Part 2: Orders, Sellers, Users, Blog CMS, Audit Log)

**Completed features**
- **Orders**: `/admin/orders` (search + status filter) and `/admin/orders/[orderId]` (full detail — items, shipping address, totals, status-change form, status-history timeline). Backend enforces nothing client-submitted is trusted for totals (unchanged from Milestone 8); status changes append to `OrderStatusHistory` rather than overwriting.
- **Sellers**: `/admin/sellers` (all sellers) and `/admin/sellers/applications` (pending only, sharing one `SellerTable` component) plus `/admin/sellers/[id]`. Approve/reject actions are the actual mechanism for the PRD's "Durchex-only at launch, dormant marketplace" decision to ever change — approving a seller here is what opens the platform to them.
- **Users**: `/admin/users` — search, role filter, and inline status actions (reactivate/suspend/ban). Suspending or banning a user immediately revokes all their refresh tokens (reuses Milestone 6's `authService.logoutAll`) so a moderation action can't be silently ignored by an already-logged-in session. Admin accounts are explicitly protected from status changes via this endpoint.
- **Blog CMS**: `/admin/cms/blog` (list, incl. drafts) + create/edit sharing one `BlogPostForm`. This closes a real gap flagged in Milestone 7's own risk notes — the public `/blog` pages existed with no way to actually publish anything. `publishedAt` is set automatically on the transition into `PUBLISHED`, not touched on subsequent edits to an already-published post.
- **Server-side HTML sanitization** (`sanitizeRichText`, via `sanitize-html`): applied to every blog post's `contentHtml` before it's persisted — not at render time. This directly closes the stored-XSS risk flagged in Milestone 7 ("blog post content trusts the backend/CMS to sanitize HTML").
- **Audit Log**: a new `auditLogService.record()` helper, wired into seller approve/reject and user status changes (the two most consequential actions built so far), plus `/admin/audit-log` to view the trail. Existing before this pass, `AuditLog` had zero producers — this makes it load-bearing rather than a shell for later.
- Sidebar expanded with Orders, Sellers (+ Applications), People (Users), Content (Blog Posts), Security (Audit Log) sections.

**Tests written**
- 20 new backend tests: `sanitizeHtml.test.ts` (4 — script-tag stripping, event-handler stripping, `javascript:` URL stripping, allowed-tag preservation), `admin/seller.service.test.ts` (5 — 404s, double-approve rejection, audit log content), `admin/user.service.test.ts` (5 — 404, ADMIN-account protection, session revocation on suspend but not reactivate, no sensitive fields leaked), `admin/blog.service.test.ts` (6 — duplicate slug, sanitization actually applied, `publishedAt` transition logic).
- Combined total: **78/78 passing** across the full `apps/api` suite.

**Verification performed**
- `tsc --noEmit` and `eslint`: clean on both apps (one pre-existing warning cleanup along the way, see below).
- Live verification after the dependency fix (below): the API process itself confirmed still running and correctly reaching `product.service.ts`-style DB-boundary errors on `/api/v1/blog` (not crashing at import time), `/admin` still redirects unauthenticated visitors to `/auth/login`, `/blog` still renders its empty state — zero console errors throughout.

**Bugs found and fixed**
1. **A real dependency-resolution bug, not just a test artifact**: `sanitize-html`'s latest 2.x (2.17.6, what `^2.13.0` resolved to) transitively pulls in `htmlparser2@12`, which ships as pure ESM with no CommonJS entry point at all. This doesn't just break Jest — it would have crashed the *running API process* the moment any route touching the blog module loaded, since `require()` cannot load a pure-ESM package. Root-caused by bisecting `sanitize-html` versions to find exactly where the nested `htmlparser2` dependency changed (2.17.1 → 2.17.2 → 2.17.6), and pinned to the last CJS-safe version (`2.17.1`, exact, not a caret range) rather than working around it with Jest transform configuration — the fix needed to hold for the real server too, not just tests.
2. Pre-existing ESLint warnings (not introduced this pass) in `auth.service.ts`'s destructured-omission pattern from Milestone 6 — the shared `.eslintrc.json`'s `no-unused-vars` rule didn't recognize `varsIgnorePattern`/`ignoreRestSiblings`. Fixed the rule config since it would have kept flagging that legitimate pattern indefinitely.

**Potential risks**
- Audit logging covers only seller approval/rejection and user status changes — product/category deletion and other consequential actions aren't recorded yet. Flagged as a deliberate scope decision (highest-value actions first), not an oversight.
- `sanitize-html` is now pinned to an exact version rather than a caret range specifically to avoid re-inheriting the ESM-only `htmlparser2`. Whoever next updates this dependency needs to re-verify the resolved `htmlparser2` still ships a CommonJS build before loosening the pin.
- Same standing sandbox caveat: no live database round-trip tested here.

**Remaining tasks**
- `/admin/roles` (fine-grained `adminPermissions` enforcement — currently coarse-grained at `role === ADMIN`)
- `/admin/payments` (provider config + transaction log), `/admin/fraud` (review queue backed by `FraudFlag`, which currently has no producer — meaningful once Milestone 11 or fraud-detection logic exists to populate it)
- `/admin/marketing/*` — coupons, gift cards, rewards, referrals, banners
- `/admin/cms/pages` (static page CMS — blog is done, static pages aren't)
- `/admin/seo`, `/admin/analytics`, `/admin/settings`
- `/admin/returns` (returns oversight — the `ReturnRequest`/`ReturnItem` models exist but have no admin surface yet)

## Milestone 10 detail — Seller Dashboard

Per the PRD's confirmed launch decision, Durchex D.A.M is the sole seller at launch but the marketplace machinery must be genuinely functional, not a stub — this milestone is that machinery.

**Completed features**
- **Onboarding** (`/seller/onboarding`): any authenticated user can apply. `POST /seller/onboarding` creates the `Seller` record (`status: PENDING`) and flips the applicant's `role` to `SELLER` in one transaction — this is the actual mechanism that turns a customer into a seller.
- **New `requireSeller` middleware** (`middleware/auth.ts`): resolves the caller's `Seller` record and attaches it to `req.seller`, so every downstream handler scopes its query to `sellerId: req.seller.id` without re-fetching it. Deliberately does *not* require `status: APPROVED` — a pending applicant still needs to reach their dashboard to see their application status, matching how Etsy/Amazon Seller Central work.
- **Dashboard** (`/seller`): KPIs (products, low-stock variants, order-item count, revenue) scoped entirely to the calling seller, plus a `SellerDashboardShell` wrapper (used by every protected seller page) that fetches the seller profile once and shows a pending/rejected/suspended banner inline rather than blocking access outright.
- **Products** (`/seller/products`, `new`, `[id]/edit`): full CRUD, sharing the same `ProductForm` shape as Milestone 9's admin version minus the seller picker (implicit from `req.seller.id`, never client-supplied — verified by test).
- **Orders** (`/seller/orders`, `[orderId]`): sellers see only the `OrderItem`s that belong to them within any order (a marketplace order can span multiple sellers) via a filtered Prisma `include`, and can update per-item `fulfillmentStatus` independently of the order's overall status.

**Tests written**
- 19 new backend tests, weighted toward the cross-seller isolation boundary since that's the actual security risk in a multi-vendor system: `seller/product.service.test.ts` (6 — a seller getting/updating/deleting another seller's product by guessing its ID gets a 404, not a 403, so ownership isn't leaked; product creation always stamps the caller's `sellerId`, ignoring any client input), `seller/order.service.test.ts` (6 — order listing/detail scoped via Prisma's filtered `include`, fulfillment updates rejected for items belonging to another seller *or* the wrong order — a cross-order tampering check), `seller/onboarding.service.test.ts` (4), `seller.rbac.test.ts` (4 — unauthenticated → 401, no seller profile → 404, onboarding reachable *before* a profile exists, existing seller passes through).
- Combined total: **97/97 passing** across the full `apps/api` suite.

**Verification performed**
- `tsc --noEmit` and `eslint`: clean on both apps, first pass, zero fixes needed (no repeat of the `set-state-in-effect` pattern from Milestones 7 and 9 — same `.then()`-scoped error-clearing pattern applied consistently from the start this time).
- Live browser verification: `/seller` and `/seller/onboarding` both correctly redirect unauthenticated visitors to `/auth/login` (same edge `proxy.ts` protection, extended to a new prefix), zero console errors.

**Bugs found and fixed**
- None this milestone — every new test file passed on its first run, and both `tsc` and `eslint` were clean on the first pass on both apps.

**Potential risks**
- No live database round-trip tested (standing sandbox caveat) — this milestone in particular deserves a real end-to-end pass once Postgres is available, since the ownership-scoping logic is security-critical and currently verified only against mocked Prisma calls.
- `SellerDashboardShell` re-fetches `/seller/me` on every protected page's mount rather than sharing one cached fetch across navigations — fine at this scale, worth revisiting with a shared store (like `useAuthStore`) if the seller dashboard grows.
- A seller whose account is `SUSPENDED` or `REJECTED` can still reach `/seller/products/new` etc. and the backend would still accept the request (only the frontend shows a banner) — the backend doesn't currently gate on `seller.status` for write operations, only on the record existing. Worth adding a stricter check before real sellers are onboarded.

**Remaining tasks**
- `/seller/products/bulk-upload` (CSV import)
- `/seller/inventory` (dedicated stock-level view — today, low stock only surfaces as a dashboard count)
- `/seller/payouts` (earnings & payout history — depends on Milestone 11's payment integration existing first)
- `/seller/analytics` (seller-level sales analytics beyond the dashboard's basic KPIs)
- `/seller/reviews` (reviews on the seller's products)
- `/seller/settings` (store profile editing, payout details)

## Milestone 11 detail — Payment Integration

No real merchant credentials exist in this sandbox (same standing situation as Cloudinary etc. since Milestone 4) — every provider below is a complete, genuine integration against that provider's real API, not a mock, structured to activate the moment real keys land in `.env`. Full detail in [docs/PAYMENTS.md](./PAYMENTS.md).

**Completed features**
- **`PaymentProviderAdapter`** — one shared `{ initiate, verify }` interface every provider implements, resolved through a single registry (`getPaymentProvider`) so `orderService` and the webhook handlers never talk to a specific SDK directly.
- **Flutterwave & Paystack** (primary, per the PRD's Africa-first decision) — real REST API integrations via `fetch`, no SDK dependency. Paystack amounts are converted to kobo outbound and back to naira inbound.
- **Stripe** (secondary) — official `stripe` npm package (verified CJS-safe before adding, learning directly from Milestone 9's `sanitize-html` incident). Uses Checkout Sessions specifically so it returns a `checkoutUrl` and fits the exact same "redirect the browser" shape as Flutterwave/Paystack, rather than needing a separate Stripe Elements/client-secret code path on the frontend.
- **Wallet** — fully functional today, no external API: debits `Wallet.balance` and records a `WalletTransaction` synchronously inside `initiate()`, so the order is marked `PAID` in the same request.
- **Bank Transfer** — fully functional: reserves a reference and leaves the order `PENDING` for manual confirmation via the existing `PATCH /admin/orders/:id/status` (Milestone 9) — reused rather than duplicated.
- **Order creation now drives payment end-to-end**: `POST /orders` creates the order, then calls `provider.initiate()` outside the DB transaction (external I/O doesn't belong inside one), and **unwinds the order (restores stock, deletes the row) if payment initiation fails** — no more orphaned `PENDING` orders that can never be paid. Covered by a dedicated test.
- **Webhooks** (`POST /api/v1/webhooks/{flutterwave,paystack,stripe}`) — mounted with `express.raw()` ahead of the global JSON parser (signature verification needs the exact original bytes). Each provider's actual signature scheme is implemented for real: Flutterwave's static-hash constant-time comparison, Paystack's HMAC-SHA512, Stripe's official SDK verification.
- **Defense in depth**: webhook payloads are never trusted on their own — `paymentWebhookService.confirmPayment()` always re-verifies the transaction directly with the provider before marking anything paid, and is idempotent (a payment already `SUCCESS` short-circuits before any provider call, so replayed webhooks are harmless).
- Frontend checkout (`/checkout/payment`) now redirects to the real `checkoutUrl` for Flutterwave/Paystack/Stripe, and the confirmation page distinguishes `PAID` from `PENDING` (bank transfer / payment still confirming). PayPal/Apple Pay/Google Pay are shown per the PRD but visibly marked "Coming soon" and disabled — honest about what's real today rather than silently broken or dishonestly clickable.

**Tests written**
- 30 new tests: `flutterwave.provider.test.ts` (7), `paystack.provider.test.ts` (7, including real HMAC-SHA512 computation — not just string equality), `wallet.provider.test.ts` (5, the highest-stakes provider since it touches real balances), `webhook.service.test.ts` (5, covering the idempotency and defense-in-depth-reverification behaviors specifically), `webhook.routes.test.ts` (3, HTTP-layer signature enforcement), plus `order.service.test.ts` extended with 2 new cases (synchronous-settlement status propagation, and the unwind-on-failure rollback).
- Combined total: **127/127 passing** across the full `apps/api` suite.

**Verification performed**
- `tsc --noEmit` and `eslint`: clean on both apps.
- Live verification: the running API process (hot-reloaded via `tsx watch`, not manually restarted) already had the new webhook routes live — `POST /webhooks/paystack` with no signature correctly returned `401` rather than `404`, confirming the routes and raw-body middleware ordering both work in the actual running server, not just under Jest. `/checkout/payment`'s empty-cart guard still redirects correctly. Zero console errors.

**Bugs found and fixed**
1. **A real correctness bug caught before it shipped, not by a test**: the Stripe webhook controller's `catch` block converted *any* error from `verifyStripeWebhookSignature` — including a `503 "Stripe is not configured"` — into a `401 "Invalid webhook signature"`. This would have misled anyone debugging "why are my Stripe webhooks failing" toward a security investigation when the real answer was a missing `STRIPE_WEBHOOK_SECRET`. Fixed by re-throwing `ApiError` instances (which already carry the correct status) unchanged, and only converting genuine Stripe SDK signature-mismatch errors to 401. Caught while writing the webhook route test, before it was written — confirms the value of writing this specific test rather than skipping it as "just a config edge case."
2. `fetch().json()` types as `unknown` under this project's strict TS config — the Flutterwave and Paystack providers initially accessed response fields without narrowing. Fixed by defining minimal response-shape interfaces for each provider rather than casting to `any`.

**Potential risks**
- No live payment has ever run against a real provider account (standing sandbox limitation) — every provider is unit-tested against mocked `fetch`/Stripe SDK responses. A full live pass (real checkout → real webhook delivery, using each provider's test-mode credentials) should happen before this goes anywhere near real money.
- PayPal, Apple Pay, and Google Pay remain unimplemented — each needs a fundamentally different client-side wallet-button SDK flow plus real merchant registration (PayPal business account; Apple/Google merchant certs), not just an API key. Documented explicitly in PAYMENTS.md so this isn't mistaken for an oversight.
- Refunds aren't implemented for any provider yet — `REFUNDED` exists as a schema status but nothing transitions to it.
- Order unwind-on-payment-failure deletes the `Order` row rather than marking it `CANCELLED` — simpler and correct today since nothing else references the order yet at that point in the flow, but worth reconsidering if an audit trail of failed payment attempts becomes valuable later.

**Remaining tasks**
- Milestone 12 onward, per the roadmap above. PayPal/Apple Pay/Google Pay and refund flows remain open payment-integration work whenever prioritized.

## Milestone 12 detail — Testing

Full detail in [docs/TESTING.md](./TESTING.md). This milestone closed the frontend test-coverage gap left by rapid feature development in Milestones 7–11 (backend already had strong coverage from Milestones 6–11), and re-verified both apps end-to-end.

**Completed features**
- New frontend test suites for the three zustand stores that back the entire shopping experience but had zero test coverage until now: `cart.store.test.ts`, `wishlist.store.test.ts`, `compare.store.test.ts`.
- New test suites for `lib/utils.ts` (`cn()` Tailwind-merge conflict resolution, `formatPrice()` NGN formatting) and for the two most stateful UI primitives, `Dialog` (open/close, Escape key, backdrop click, focus restore, body-scroll lock) and `Accordion` (single-open-at-a-time behavior).
- Full re-verification pass across both apps: `tsc --noEmit`, `eslint --max-warnings=0`, and `jest --ci --runInBand`.
- `docs/TESTING.md` — the first document in this project to explicitly enumerate what was *not* tested and why (no live Postgres, no live payment provider calls, no Docker build, no accessibility/load/visual-regression tooling), rather than letting those gaps stay implicit.

**Tests written**
- Frontend: 22 new tests across 5 new files (`cart.store` 12, `wishlist.store` 4, `compare.store` 6) plus `utils.test.ts` (4) and `Dialog.test.tsx` (7) and `Accordion.test.tsx` (4) — **55/55 passing** across the full `apps/web` suite (10 suites total, including the pre-existing `Button`, `Rating`, `auth.store`, `api-client` suites from Milestones 5–6).
- Backend: no new tests this milestone — the existing 127 were re-run and re-confirmed passing rather than duplicated. **127/127 passing** across `apps/api` (23 suites).

**Verification performed**
- `apps/web`: `tsc --noEmit` clean, `eslint . --max-warnings=0` clean, `jest --ci --runInBand` — 55/55 passing.
- `apps/api`: `tsc --noEmit` clean, `eslint . --max-warnings=0` clean, `jest --ci --runInBand` — 127/127 passing.

**Bugs found and fixed**
1. `Dialog.test.tsx`'s backdrop-click test initially queried the RTL `container` for `[aria-hidden="true"]` and got `null` — `Dialog` renders via `createPortal` directly into `document.body`, not into the render root `container` holds a reference to. Fixed by querying `document.body` instead. Caught immediately by the first test run, not a latent bug in the component itself (the component's actual behavior was already correct).

**Potential risks**
- Standing sandbox caveat, unchanged from every prior milestone: no live Postgres, no live payment provider, no Docker daemon available here. See `docs/TESTING.md` §3 for the full, explicit list — carried forward rather than re-summarized here to avoid drift between the two documents.
- Frontend coverage is strong at the store/primitive level but does not include page-level rendering tests (e.g. full checkout flow, product listing). Page correctness for Milestones 7–11 was verified live through the browser preview at the time each was built, not through automated page-level tests — a gap worth closing with integration tests once a real dev/staging environment with a live database exists.
- No dedicated `stripe.provider.test.ts` — Stripe is exercised only indirectly through `order.service.test.ts`. Flagged in `docs/TESTING.md` rather than left unmentioned.

**Remaining tasks**
- Milestone 13 (Deployment), next in the roadmap.
- Dedicated Stripe provider tests (see above).
- Page-level/E2E tests once a real database environment is available (e.g. Playwright against a seeded staging deployment) — deferred rather than attempted against mocked data, where an E2E test would mostly just be re-testing the mocks.

## Milestone 13 detail — Deployment

No cloud accounts (Vercel, Railway, a managed Postgres/Redis provider) or Docker daemon exist in this sandbox — the same standing limitation noted since Milestone 4, confirmed again this milestone (`docker --version` → command not found). Full detail, architecture diagram, and the deploy runbook live in [docs/DEPLOYMENT.md](./DEPLOYMENT.md); this section covers what was built and verified.

**Completed features**
- **`apps/api/Dockerfile`** — multi-stage (deps → build → runtime) production image. Generates the Prisma client and compiles TypeScript in the build stage, `npm prune --omit=dev` before the runtime copy, runs as a non-root user, and its `HEALTHCHECK` hits the existing `GET /api/v1/health` endpoint (Milestone 8) rather than inventing a new one.
- **`apps/web/Dockerfile`** — multi-stage image built on Next.js's `output: "standalone"` server, for self-hosting outside Vercel. Not used by the Vercel deploy path (§4 of DEPLOYMENT.md) — it exists for `docker-compose.prod.yml` and bare-VPS deployment.
- **`next.config.mjs`** updated with `output: "standalone"` and `outputFileTracingRoot` (pointed at the monorepo root) — required because npm workspaces hoist dependencies to the root `node_modules`, which Next's file tracer misses by default when a project lives inside a monorepo subdirectory.
- **`docker-compose.prod.yml`** — a second, separate compose file from the existing dev-only `docker-compose.yml` (Postgres+Redis only): this one runs the *full* stack (Postgres, Redis, API, web) built from the two new Dockerfiles, for single-VPS self-hosting.
- **`.github/workflows/ci.yml`** — GitHub Actions: lint + `tsc --noEmit` + `jest` for each app independently, then a combined production-build job gated on both passing. Runs on every push/PR to `main`.
- **`apps/web/vercel.json`** — overrides Vercel's install/build commands to run from the monorepo root (`cd ../.. && npm ci` / `npm run build:web`), since `apps/web` has no lockfile of its own under npm workspaces.
- **`docs/DEPLOYMENT.md`** — architecture diagram, environment variable reference (which service reads which var), step-by-step API and web deploy instructions, the post-deploy checklist (payment webhook URL registration reusing Milestone 11's signature table, live-mode key swap, health monitoring), the Docker self-hosting path, and a rollback strategy per component.
- **Root `.dockerignore`** — added; excludes `node_modules`, build output, `.env`, and `docs/` from the Docker build context for both Dockerfiles.

**Tests written**
- None — deployment configuration isn't unit-testable in the way application code is. Instead, verified by actually running the relevant build tooling (see below) rather than skipped untested.

**Verification performed**
- `apps/web`: ran a real `next build` after the `next.config.mjs` change — succeeded, and the resulting `.next/standalone/` output was inspected directly: `apps/web/server.js` and a root-level `node_modules/` appeared exactly where `apps/web/Dockerfile`'s `COPY` instructions expect them, confirming `outputFileTracingRoot` was configured correctly rather than assumed. Build artifact removed afterward (not meant to be committed; already `.gitignore`d).
- Full re-verification pass across both apps after all Milestone 13 changes: `tsc --noEmit` clean, `eslint --max-warnings=0` clean, `jest --ci --runInBand` — **127/127** (`apps/api`, 23 suites) and **55/55** (`apps/web`, 10 suites), both unchanged from Milestone 12 since no application code or tests were touched this milestone.

**Bugs found and fixed**
1. Both Dockerfiles' `build` stages initially copied only `tsconfig.base.json` and the target app's source into `/repo` before running `npm run --workspace=<app> ...` — without the root `package.json` (and, for the API image, `npm prune --omit=dev` without `package-lock.json`), npm would have had nothing to resolve the workspace from. Caught by re-reading the Dockerfiles against how npm workspaces actually resolve `--workspace` flags, before any build attempt (no Docker daemon exists here to have caught it empirically) — fixed by copying `package.json`/`package-lock.json` (and the sibling app's `package.json`, for lockfile consistency) into both build stages.

**Potential risks**
- **Neither Dockerfile has ever been built.** This is the largest standing gap of this milestone: both were written directly against documented Next.js/Prisma/npm-workspaces conventions rather than verified against a real `docker build`. The bug above shows manual review catches some issues, not all — building both images against a real Docker daemon should be the first action taken before relying on this path for a real deployment.
- No live deploy has ever been performed against real Vercel/Railway/managed-DB accounts — `docs/DEPLOYMENT.md`'s steps are unexecuted, same standing caveat as every external-service integration in this project.
- The API's `cors()` middleware allows a single origin (`env.APP_URL`). This works because the browser never talks to the API directly — Next's `rewrites()` proxy every `/api/*` call server-side — but if that proxy is ever bypassed (e.g. a mobile client calling the API directly), CORS will need to become a list rather than a single string.

**Remaining tasks**
- Build and run both Docker images against a real Docker daemon; run `docker-compose.prod.yml` end-to-end.
- Perform an actual deploy to Vercel + a container platform, using `docs/DEPLOYMENT.md` as the runbook, and register real webhook URLs with each payment provider.
- All previously-documented deferred items from Milestones 9–12 (admin sub-areas, seller sub-pages, PayPal/Apple Pay/Google Pay, refunds, dedicated Stripe provider tests, page-level E2E tests) remain open, unrelated to this milestone.
