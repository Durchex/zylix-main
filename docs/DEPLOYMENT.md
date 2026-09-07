# ZYLIX — Deployment

**Version:** 2.0
**Status:** Migrated off Render/Postgres/Redis onto a single Vercel deployment
**Depends on:** [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md), [PAYMENTS.md](./PAYMENTS.md), [TESTING.md](./TESTING.md)

The app is one Next.js deployment on Vercel (`apps/web`) — there is no separate API service. What used to be `apps/api` (Express + Prisma/Postgres, deployed on Render) has been ported to route handlers inside `apps/web/src/app/api/v1/**`, running on Mongoose/MongoDB. Images are stored on Cloudinary, unchanged. `apps/api` itself still exists in the repo for reference during the transition but is no longer deployed anywhere — see §5.

---

## 1. Architecture

```
Browser
  │
  ▼
Vercel (apps/web — Next.js: pages + API route handlers, one deployment)
  │  • Same origin, always — the browser only ever talks to this one URL.
  │    No CORS, no cross-domain cookie concerns: they were the direct
  │    cause of "domain change breaks login" incidents under the old
  │    split Vercel+Render setup, and can't happen here by construction.
  │
  ├──▶ MongoDB (Atlas, or any replica set — see §2 on why a replica set
  │     is required, not optional)
  └──▶ Cloudinary, Flutterwave, Paystack, Stripe (external APIs)
```

## 2. Environment variables

Full list and defaults: [`.env.example`](../.env.example). Set these in the Vercel project's Environment Variables (Production/Preview/Development) and, for local dev, in `apps/web/.env.local`.

| Variable | Notes |
|---|---|
| `NODE_ENV` | `production` in every deployed environment |
| `APP_URL` | The app's own public URL — used to build email links (verification, password reset) and the checkout-confirmation redirect, and as the fallback base `serverApiRequest` uses to call this app's own API routes from Server Components (falls back to Vercel's `VERCEL_URL` automatically if unset, so it's optional on Vercel but should still be set for correct email links) |
| `MONGODB_URI` / `MONGODB_DB` | Atlas connection string (already a replica set) or a self-managed one |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Generate fresh 32+ char secrets for production — **never reuse dev values** |
| `SETUP_SECRET` | Guards `POST /api/v1/setup/admin`, the one-time admin bootstrap endpoint (see §4) |
| `CLOUDINARY_*` | From the Cloudinary dashboard |
| `FLUTTERWAVE_*` / `PAYSTACK_*` / `STRIPE_*` | Live-mode keys — see §5 of [PAYMENTS.md](./PAYMENTS.md) for webhook URL registration |
| `DEFAULT_CURRENCY` / `DEFAULT_LOCALE` | `NGN` / `en` at launch |

No `NEXT_PUBLIC_*` API variables exist — every client-side call goes through the relative `/api/v1` path (`apps/web/src/lib/api-client.ts`), which is always same-origin now.

### MongoDB needs a replica set

Order placement and a handful of other writes use a Mongoose/MongoDB transaction (atomic stock decrement + order creation, for instance) — transactions require the database to be a replica set, even a single-node one. Atlas is always a replica set regardless of tier, so this is a non-issue there. A plain local `mongod` is **not** one by default; for local dev, either point `MONGODB_URI` at a free Atlas cluster, or run Mongo locally with `--replSet rs0` and initiate it once (`mongosh --eval "rs.initiate()"`). Without this, checkout will fail locally with a transaction-not-supported error.

## 3. Deploying to Vercel

1. Import the repo into Vercel.
2. Project settings → **Root Directory**: `apps/web`. Vercel then picks up `apps/web/vercel.json`, which runs install/build from the monorepo root (`cd ../.. && npm ci` / `npm run build:web`) — needed because `apps/web` alone doesn't have its own lockfile under npm workspaces.
3. Set every variable from §2's table, for all three Vercel environments.
4. Deploy. Vercel's Next.js runtime handles SSR/ISR/static assets and the API route handlers natively — nothing else to configure.
5. Attach the production domain. No follow-up redeploy is needed for auth to keep working (unlike the old Render setup) — same-origin cookies don't care what the domain is.

## 4. First admin account

There's no shell access on Vercel to run a seed script directly, so admin bootstrap goes through an HTTP endpoint instead, guarded by `SETUP_SECRET`:

```bash
curl -X POST "https://<your-domain>/api/v1/setup/admin" \
  -H "Content-Type: application/json" \
  -d '{"secret":"<SETUP_SECRET value>","email":"admin@example.com","password":"a-strong-password"}'
```

Idempotent — safe to re-run (it upserts by email). Rotate or unset `SETUP_SECRET` afterward if it's not needed again.

## 5. Post-deploy checklist

- **Payment webhooks** — register each production webhook URL in the provider's dashboard, per [PAYMENTS.md](./PAYMENTS.md)'s signature table:
  - Flutterwave: `{APP_URL}/api/v1/webhooks/flutterwave`
  - Paystack: `{APP_URL}/api/v1/webhooks/paystack`
  - Stripe: `{APP_URL}/api/v1/webhooks/stripe`
  Copy each provider's *live-mode* signing secret into the matching env var (`FLUTTERWAVE_WEBHOOK_SECRET_HASH`, `STRIPE_WEBHOOK_SECRET`, etc.) — test-mode and live-mode secrets are different values.
- **Swap every payment key from test-mode to live-mode** before accepting real transactions — nothing in the codebase enforces this distinction; it's operational discipline.
- **`GET /api/v1/health`** — point uptime monitoring at this endpoint; it reports MongoDB connectivity.
- **Footer / branding** — confirm "Powered by Durchex D.A.M Company LTD" renders on the live domain.

## 6. What happened to `apps/api`, Render, Postgres, and Redis

- **Render + the standalone Express API (`apps/api`)** — decommissioned. The code is still in the repo (untouched, still builds and tests standalone) as a reference during the transition, but nothing deploys it anymore. It can be deleted once the Vercel deployment has been running in production without issues for a while.
- **PostgreSQL / Prisma** — replaced by MongoDB / Mongoose (`apps/web/src/server/models/**`). There is no migration path for existing production data in this change — if the old Render deployment held real customer/order data, it needs a one-time export/import into MongoDB before cutover, which isn't automated here.
- **Redis** — dropped outright rather than replaced. It was only ever wired to the health check in the old API; nothing cached through it. Rate limiting, which used to be in-memory per Express process, now uses a small MongoDB-backed counter collection (`apps/web/src/server/http/rateLimit.ts`) instead — a Redis-backed limiter would be a reasonable upgrade later if request volume grows enough to matter, but isn't required.
- `render.yaml`, the Render-specific deployment blueprint, has been removed. `docker-compose*.yml` and both apps' `Dockerfile`s still describe the old Postgres+Redis+two-service topology and are now stale — left in place but not maintained; delete or rewrite them if a Docker-based deployment path is wanted again.

## 7. CI

`.github/workflows/ci.yml`, if still configured for the old two-app split, needs updating to build/typecheck/test only `apps/web` going forward (`npm run build`, `npm run lint`, `npm run test` at the repo root now all resolve to the web app only — see the root `package.json`).

## 8. Rollback

Every Vercel deployment is immutable and keeps its own URL — use the dashboard's "Promote to Production" on a prior deployment, no rebuild needed. There's no separate API to roll back independently anymore.
