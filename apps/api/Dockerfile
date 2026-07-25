# ZYLIX API — production image.
#
# Built from the monorepo root (see docs/DEPLOYMENT.md), because this is an
# npm workspaces project: `npm ci` needs every workspace's package.json to
# resolve the shared lockfile, and the Prisma client is generated against
# the hoisted root node_modules.
#
#   docker build -f apps/api/Dockerfile -t zylix-api .
#
# Runtime environment variables (DATABASE_URL, JWT secrets, etc.) are never
# baked into this image — see .env.example and docs/DEPLOYMENT.md. They are
# injected by the hosting platform (Railway/Render/Fly/`docker run --env-file`).

# ---- deps: install the full workspace dependency graph once ----
FROM node:20-alpine AS deps
RUN apk add --no-cache openssl libc6-compat
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

# ---- build: compile TypeScript and generate the Prisma client ----
FROM node:20-alpine AS build
RUN apk add --no-cache openssl libc6-compat
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api ./apps/api
RUN npm run --workspace=apps/api prisma:generate
RUN npm run --workspace=apps/api build
RUN npm prune --omit=dev

# ---- runtime: minimal image with only what's needed to run the server ----
FROM node:20-alpine AS runtime
RUN apk add --no-cache openssl && addgroup -S zylix && adduser -S zylix -G zylix
WORKDIR /repo
ENV NODE_ENV=production
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/api/dist ./apps/api/dist
COPY --from=build /repo/apps/api/package.json ./apps/api/package.json
COPY --from=build /repo/apps/api/prisma ./apps/api/prisma

USER zylix
WORKDIR /repo/apps/api
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:' + (process.env.PORT || 4000) + '/api/v1/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/index.js"]
