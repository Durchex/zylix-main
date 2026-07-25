# ZYLIX — Deployment

**Version:** 1.0
**Status:** Configuration & documentation complete — Milestone 13 of 13
**Depends on:** [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md), [PAYMENTS.md](./PAYMENTS.md), [TESTING.md](./TESTING.md)

No cloud accounts (Vercel, Railway, a managed Postgres/Redis provider, a domain registrar) or Docker daemon exist in this sandbox — the same standing limitation noted in every prior milestone. This document is the complete, genuine deployment configuration and runbook, written so that following it against real accounts produces a working production deployment. Nothing described here has actually been deployed or Docker-built from this environment; §6 says exactly that, explicitly.

---

## 1. Architecture

```
Browser
  │
  ▼
Vercel (apps/web — Next.js, SSR + static)
  │  • Same-origin to the browser always. next.config.mjs's rewrites()
  │    proxy /api/:path* server-side to the API — the browser never talks
  │    to the API's origin directly, so cookies (the refresh token) and
  │    CORS stay simple regardless of how many Vercel preview URLs exist.
  ▼
Railway / Render / Fly.io / VPS (apps/api — Express, Dockerized)
  │
  ├──▶ Managed PostgreSQL (Neon / Supabase / Railway Postgres / RDS)
  ├──▶ Managed Redis (Upstash / Railway Redis / ElastiCache)
  └──▶ Cloudinary, Flutterwave, Paystack, Stripe (external APIs)
```

Two independently deployable services, one shared `.env` contract (`.env.example`). Web is Vercel-first (zero-config for Next.js); the API is a plain Node/Express process, deployed as the Docker image built by `apps/api/Dockerfile` to whichever platform runs containers.

## 2. Environment variables

Full list and defaults: [`.env.example`](../.env.example). Split by which service actually reads each one:

| Variable | Read by | Notes |
|---|---|---|
| `NODE_ENV` | both | `production` in every deployed environment |
| `APP_URL` | api | The web app's public URL — used for the API's CORS allow-list |
| `API_URL` | web (build **and** runtime) | The API's public URL — baked into the Next rewrite at build time, so a change requires a redeploy, not just an env var update |
| `PORT` | api | Most platforms (Railway, Render, Fly) inject this automatically; `env.ts` defaults to `4000` if unset |
| `DATABASE_URL` / `REDIS_URL` | api | From the managed Postgres/Redis provider |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | api | Generate fresh 32+ char secrets for production — **never reuse the dev `.env` values** |
| `CLOUDINARY_*` | api | From the Cloudinary dashboard |
| `FLUTTERWAVE_*` / `PAYSTACK_*` / `STRIPE_*` | api | Live-mode keys — see §5 for webhook URL registration |
| `DEFAULT_CURRENCY` / `DEFAULT_LOCALE` | both | `NGN` / `en` at launch, per the PRD |

The web app has no `NEXT_PUBLIC_*` variables today — every client-side API call goes through the relative `/api/v1` path (`apps/web/src/lib/api-client.ts`) that `next.config.mjs`'s rewrite proxies server-side, so nothing about the API's location needs to reach the browser bundle.

`apps/api/src/config/env.ts` loads `.env` from a path relative to its own compiled location, but only as a **local-dev convenience** — `dotenv.config()` fails silently (not a thrown error) when the file doesn't exist, which is exactly the production case: no `.env` file is ever built into a container image (`.dockerignore` excludes it), and the Zod schema parses whatever the platform already injected into `process.env` instead.

## 3. Deploying the API

Target: any platform that runs a Dockerfile and exposes a port (Railway and Render both do this with zero extra config beyond pointing at `apps/api/Dockerfile`; Fly.io and a bare VPS work the same way via `fly deploy` / `docker run`).

1. Provision managed Postgres and Redis; note their connection strings.
2. Create the service, pointing its build at this repo with:
   - **Dockerfile path:** `apps/api/Dockerfile`
   - **Build context:** repo root (`.`) — required, since `npm ci` needs every workspace's `package.json` to resolve the shared `package-lock.json`. Passing `apps/api` alone as the context will fail the build.
3. Set every `api`-scoped variable from the table above. Set `APP_URL` to the web app's real production URL (needed before step 5's webhook step, but can be set to a placeholder and updated after Vercel is live).
4. Deploy. The image's `HEALTHCHECK` hits `GET /api/v1/health` (already built in Milestone 8) — point the platform's own health-check probe at the same path so a degraded DB/Redis connection (503) is caught before traffic is routed to it.
5. Run the production migration once, against the live `DATABASE_URL`:
   ```bash
   npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
   ```
   Run this from the platform's shell/one-off job runner, or locally with `DATABASE_URL` pointed at the production database — never `prisma migrate dev` against production (it can generate and prompt for destructive changes interactively).

## 4. Deploying the web app (Vercel)

1. Import the repo into Vercel.
2. Project settings → **Root Directory**: `apps/web`. Vercel then picks up `apps/web/vercel.json`, which overrides the install/build commands to run from the monorepo root (`cd ../.. && npm ci` / `npm run build:web`) — necessary because `apps/web` alone doesn't have its own lockfile under npm workspaces.
3. Environment variables → set `API_URL` to the deployed API's public URL (from §3). Set it for all three Vercel environments (Production/Preview/Development) — Preview deployments should point at a staging API if one exists, or the same production API if not (read-heavy pages degrade gracefully; anything that writes should be tested against staging first once one exists).
4. Deploy. Vercel's Next.js runtime handles SSR/ISR/static assets natively — `apps/web/Dockerfile` is not used here, it exists solely for the self-hosted path in §6.
5. Attach the production domain, then set the API's `APP_URL` (§3) to that final domain and redeploy the API so CORS reflects the real origin.

## 5. Post-deploy checklist

- **Payment webhooks** — register each production webhook URL in the provider's dashboard, per [PAYMENTS.md](./PAYMENTS.md)'s signature table:
  - Flutterwave: `{API_URL}/api/v1/webhooks/flutterwave`
  - Paystack: `{API_URL}/api/v1/webhooks/paystack`
  - Stripe: `{API_URL}/api/v1/webhooks/stripe`
  Copy each provider's *live-mode* signing secret into the matching env var (`FLUTTERWAVE_WEBHOOK_SECRET_HASH`, `STRIPE_WEBHOOK_SECRET`, etc.) — test-mode and live-mode secrets are different values.
- **Swap every payment key from test-mode to live-mode** before accepting real transactions — nothing in the codebase enforces this distinction; it's operational discipline.
- **`GET /api/v1/health`** — point uptime monitoring (even something as simple as a cron'd curl + alert) at this endpoint; it already reports `database`/`redis` sub-status individually.
- **Footer / branding** — confirm "Powered by Durchex D.A.M Company LTD" renders on the live domain (it's in the shared layout, but worth a real visual check post-deploy, not just trusting the code).

## 6. Docker / self-hosting path

`apps/api/Dockerfile` and `apps/web/Dockerfile` are genuine multi-stage production builds (not dev conveniences) — `docker-compose.prod.yml` runs the full stack (Postgres, Redis, API, web) from them for a single-VPS deployment:

```bash
cp .env.example .env   # fill in real production secrets
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
```

Both Dockerfiles build from the **repo root** as context (`docker build -f apps/api/Dockerfile .`) for the same npm-workspaces reason as Vercel's install command in §4. Neither bakes secrets into the image — `.dockerignore` excludes `.env`, and both `HEALTHCHECK`s reuse the same endpoints as their managed-platform equivalents.

**Honesty note:** no Docker daemon is available in this sandbox (confirmed — `docker --version` returns "command not found" here), so neither Dockerfile has actually been built or run. They were written directly against documented Next.js `output: "standalone"` and Prisma-in-Alpine conventions (openssl + libc6-compat packages, matching build/runtime base images so the generated Prisma query engine binary matches at runtime) rather than verified empirically. Building both images against a real Docker daemon should be the first thing done before relying on this path.

## 7. CI

`.github/workflows/ci.yml` runs on every push/PR to `main`: lint + `tsc --noEmit` + `jest` for each app independently (mirroring [TESTING.md](./TESTING.md) — no live database needed, since every test mocks Prisma), then a combined `npm run build` job gated on both passing. It does not deploy anything — no `VERCEL_TOKEN`/platform credentials exist in this sandbox to wire up continuous deployment, and Vercel's own GitHub integration (auto-deploy on push once the project is imported, per §4) already covers the web app without needing a custom Actions step.

## 8. Rollback

- **Vercel:** every deployment is immutable and keeps its own URL — use the dashboard's "Promote to Production" on a prior deployment, no rebuild needed.
- **API:** redeploy the previous image tag/commit on whichever platform is used (Railway/Render both keep deployment history with one-click rollback; a bare Docker host should tag images by commit SHA so `docker run zylix-api:<previous-sha>` is always available).
- **Database migrations:** `prisma migrate deploy` is forward-only by design. A migration that must be undone needs a new forward migration that reverses the change — never edit or delete an already-applied migration file.

## 9. Render specifics (API)

The concrete provider this deployment actually used for the API, as a specific instance of §3's generic Railway/Render/Fly example. `render.yaml` (repo root) holds the config and still follows §2's environment variable contract exactly.

1. Render dashboard → New → Blueprint → select this repo → it reads `render.yaml`, which provisions a managed Postgres database and the `zylix-api` web service (built from `apps/api/Dockerfile`, context = repo root, health check = `/api/v1/health`, JWT secrets auto-generated).
2. Render's managed Redis product ("Key Value") isn't in the blueprint — its schema field has changed across Render's product history, so create it manually: New → Key Value → copy its connection string into `zylix-api`'s `REDIS_URL` env var.
3. Set the remaining `sync: false` variables in the blueprint (`APP_URL`, Cloudinary, payment provider keys) in the `zylix-api` service's Environment tab. `APP_URL` needs the Vercel URL from §4.
4. Run the migration once against the Render Postgres external connection string: `npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma` (same command as §3 step 5).

**Cross-origin cookies:** since the web app (Vercel) and API (Render) are on different domains, the refresh-token cookie is set with `sameSite: "none"` in production (`apps/api/src/controllers/auth.controller.ts`) — required for the browser to send it on a cross-site fetch at all. Paired with `secure: true` (already conditional on `NODE_ENV === "production"`), per the `SameSite=None` spec requirement. Local dev keeps `sameSite: "lax"` since frontend and API are same-site there via the rewrite proxy.

Everything else — webhook registration, health check monitoring, migration discipline, rollback — follows §4, §5, and §8 unchanged.
