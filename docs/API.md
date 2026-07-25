# ZYLIX — Backend API Reference

**Version:** 1.0
**Status:** Complete (public storefront endpoints) — Milestone 8 of 13
**Depends on:** [DATABASE.md](./DATABASE.md), [AUTHENTICATION.md](./AUTHENTICATION.md)

All routes are mounted under `/api/v1`. Auth endpoints are documented separately in [AUTHENTICATION.md](./AUTHENTICATION.md).

This milestone builds every endpoint the Milestone 7 frontend pages already call — the exact contracts were fixed by the frontend first (see [PROGRESS.md](./PROGRESS.md)'s Milestone 7 notes), so this is an implementation-to-spec pass, not a design-from-scratch one.

---

## 1. Products

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/products` | No | List with filters: `category`, `seller`, `brand`, `search`, `minPrice`, `maxPrice`, `sort` (`newest`\|`price-asc`\|`price-desc`\|`rating`), `featured`, `ids` (comma-separated), `page`, `pageSize`. Returns `PaginatedResult<ProductSummary>`. |
| GET | `/products/by-id/:id` | No | Full detail by ID (used by `/compare`). **Registered before `/:slug`** — Express matches routes in order, so this would otherwise be swallowed as a slug value. Covered by a regression test. |
| GET | `/products/:slug` | No | Full detail by slug (PDP). |

Only `status: ACTIVE` products are ever returned publicly. Prisma `Decimal` fields (`basePrice`, `avgRating`, variant `price`, etc.) are serialized via `.toString()` to match the frontend's `string`-typed price fields — floating-point money bugs are exactly why Postgres stores these as `Decimal`, so the API never converts them to a JS `number`.

## 2. Categories

`GET /categories` and `GET /categories/:slug` — only `isActive: true` categories.

## 3. Sellers

`GET /sellers` and `GET /sellers/:slug` — only `status: APPROVED` sellers. `/brands` and `/brands/[brand]` in the frontend map to these.

## 4. Blog

`GET /blog` (paginated) and `GET /blog/:slug` — only `status: PUBLISHED` posts with `publishedAt <= now()`.

## 5. Support

`POST /support/contact` — rate-limited (`publicFormRateLimiter`, 10/hour) since it's an unauthenticated public form. Persists to `ContactMessage`; no email dispatch yet (that's the `emailService` extension point from Milestone 6, same pattern).

## 6. Orders

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/orders` | Bearer | Creates an order from cart line items. Server-side price lookup only — client-submitted prices are never trusted. Validates variant stock, decrements it, and creates the `Order` + `OrderItem`s + a `PENDING` `Payment` record in one transaction. Guest checkout (schema supports `guestEmail`) isn't wired yet since the current checkout form doesn't collect an email — flagged as a gap below. |
| GET | `/orders/track` | No | `?orderNumber=&email=` — matches against either `guestEmail` or the order's account email. |
| GET | `/orders/:orderId` | No (deliberately) | Powers the checkout confirmation page, which is server-rendered *without* the browser's in-memory access token — see the security note below. |

**Security note on `GET /orders/:orderId` being public:** the confirmation page can't carry a Bearer token (it's a Server Component render, not a browser fetch), so it relies on the order ID itself — a `cuid`, effectively unguessable — as the bearer secret. This is the same accepted pattern most storefronts use for guest order-confirmation pages. To minimize exposure, the endpoint returns only `{ orderNumber, total, currency }`, not full order/customer detail. A future authenticated `GET /account/orders/:orderId` (Milestone 9/10 territory) should return the full detail and *should* check `order.userId === req.user.id`.

**Shipping fee logic:** flat ₦2,000, free above ₦100,000 subtotal — a real, simple rule (not a placeholder), reasonable to revisit once real shipping-zone data exists. **Tax is currently 0** — no Nigerian VAT computation was specified in the PRD, so none was invented.

## 7. Gift Cards

`POST /gift-cards` — optional auth (`attachUserIfPresent`; guests can buy gift cards). Rate-limited. Creates the `GiftCard` row with `isActive: false` — Milestone 11's payment webhook is what activates it once a charge actually clears. Extended the schema with `senderName`/`message` fields the frontend form already collected but the schema didn't have yet (same "frontend contract first" pattern as the rest of this milestone).

## 8. Referrals

`GET /referrals/me` — Bearer required. Returns `{ code, totalReferred, totalRewardsEarned }`. `totalRewardsEarned` sums the account's entire `RewardPointsLedger` (`type: EARN`) — the schema doesn't tag ledger entries by source, so this is *all* reward points earned, not referral-specific ones; noted as a schema gap if per-source attribution is wanted later.

## 9. Newsletter

`POST /newsletter/unsubscribe` — `{ email }`, upserts `NewsletterSubscriber` to `isSubscribed: false`.

---

## Cross-cutting notes

- **`attachUserIfPresent` middleware** (new this milestone, `middleware/auth.ts`): like `requireAuth` but never rejects — attaches `req.user` if a valid bearer token is present, otherwise proceeds as a guest. Used for gift card purchases, where being logged in only adds attribution.
- **`utils/pagination.ts`**: shared `parsePagination`/`paginate` helpers reused by Products and Blog, keeping the `{ items, total, page, pageSize, totalPages }` shape consistent everywhere the frontend expects `PaginatedResult<T>`.
- **Route ordering matters** wherever a static segment (`/by-id/:id`, `/track`) sits alongside a dynamic one (`/:slug`, `/:orderId`) on the same router — the static route must be registered first. Both instances in this milestone (`product.routes.ts`, `order.routes.ts`) have a route-ordering regression test.

## Known gaps (deliberate, tracked)

- **No Cart/Wishlist persistence API yet** — Milestone 7's cart/wishlist/compare stay client-side (localStorage) per their own documented risk. Wiring `Cart`/`CartItem`/`Wishlist`/`WishlistItem` to real endpoints is natural follow-up work once account-level sync is prioritized.
- **Guest checkout email isn't collected** — `POST /orders` requires auth for now; the schema's `guestEmail` path is unused until the checkout form grows an email field for guest purchases.
- **No live database testing in this sandbox** — Docker/Postgres aren't available here (documented since Milestone 4). Every service method is unit-tested against a mocked Prisma client, and every route is integration-tested via `supertest` against the real Express app with mocked Prisma — but a full live round-trip against real Postgres should be run once you have `docker compose up -d` locally.
