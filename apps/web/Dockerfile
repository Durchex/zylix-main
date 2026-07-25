# ZYLIX web — production image, for self-hosting outside Vercel (e.g. a VPS
# or docker-compose.prod.yml). Vercel does not use this file.
#
# Built from the monorepo root, same reasoning as apps/api/Dockerfile:
#
#   docker build -f apps/web/Dockerfile -t zylix-web .
#
# API_URL must be provided at build AND run time — Next reads it at build
# time to bake the rewrite destination, and the standalone server reads it
# again at boot. NEXT_PUBLIC_* vars would need to be passed as --build-arg
# if any are ever added; none exist today (see apps/web/src/lib/api-client.ts,
# which calls the relative /api/v1 path proxied by next.config.mjs's rewrite).

# ---- deps ----
FROM node:20-alpine AS deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

# ---- build ----
FROM node:20-alpine AS build
WORKDIR /repo
ARG API_URL=http://api:4000
ENV API_URL=$API_URL
COPY --from=deps /repo/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web ./apps/web
RUN npm run --workspace=apps/web build

# ---- runtime: Next's standalone server, not the full node_modules tree ----
FROM node:20-alpine AS runtime
RUN addgroup -S zylix && adduser -S zylix -G zylix
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /repo/apps/web/public ./apps/web/public
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static

USER zylix
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:' + (process.env.PORT || 3000) + '/').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "apps/web/server.js"]
