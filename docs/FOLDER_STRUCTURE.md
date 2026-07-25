# ZYLIX — Folder Structure

**Version:** 1.0
**Status:** Complete — Milestone 4 of 13

```
Project/
├── apps/
│   ├── web/                        # Next.js 16 (App Router) storefront + all dashboards
│   │   ├── src/
│   │   │   ├── app/                # Route segments (populated in Milestone 7+)
│   │   │   │   ├── layout.tsx      # Root layout — wraps every page, renders Footer
│   │   │   │   ├── page.tsx        # Home (currently: build progress tracker)
│   │   │   │   └── globals.css     # Tailwind entrypoint + Zylix CSS variables
│   │   │   ├── components/
│   │   │   │   ├── layout/         # Header, Footer, Sidebar, Nav (Footer built now)
│   │   │   │   └── ui/             # Design-system primitives (Milestone 5)
│   │   │   ├── lib/                # Client-side utilities, API client, formatters
│   │   │   ├── hooks/               # Custom React hooks
│   │   │   ├── types/               # Shared TS types for the frontend
│   │   │   └── styles/              # Additional style modules
│   │   ├── public/                  # Static assets
│   │   ├── next.config.mjs
│   │   ├── tailwind.config.ts
│   │   ├── postcss.config.mjs
│   │   ├── eslint.config.mjs        # Flat config (ESLint 9 + eslint-config-next)
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── api/                         # Express + TypeScript REST API
│       ├── src/
│       │   ├── config/
│       │   │   └── env.ts           # Zod-validated environment variables
│       │   ├── routes/               # Route definitions per domain
│       │   │   ├── health.routes.ts  # GET /api/v1/health (DB + Redis checks)
│       │   │   └── index.ts          # Router aggregator
│       │   ├── controllers/          # Request handlers (Milestone 8+)
│       │   ├── services/             # Business logic (Milestone 8+)
│       │   ├── middleware/
│       │   │   └── errorHandler.ts   # Centralized error handling + ApiError class
│       │   ├── lib/
│       │   │   ├── prisma.ts         # Prisma client singleton
│       │   │   ├── redis.ts          # ioredis client
│       │   │   └── logger.ts         # Winston logger
│       │   ├── utils/                 # Shared backend utilities
│       │   ├── types/                 # Shared TS types for the backend
│       │   ├── app.ts                 # Express app factory (middleware pipeline)
│       │   └── index.ts               # Entry point — starts server, graceful shutdown
│       ├── prisma/
│       │   └── schema.prisma          # Full data model (Milestone 3)
│       ├── eslint.config / .eslintrc.json
│       ├── tsconfig.json
│       └── package.json
│
├── docs/                             # All milestone deliverables live here
│   ├── PRD.md
│   ├── SITEMAP.md
│   ├── DATABASE.md
│   ├── FOLDER_STRUCTURE.md           # this file
│   └── PROGRESS.md                   # live build checklist
│
├── docker-compose.yml                # Local Postgres 16 + Redis 7 for development
├── package.json                      # Root workspace orchestration (npm workspaces)
├── tsconfig.base.json                # Shared strict TS compiler options
├── .env.example / .env               # Environment variable contracts
└── .gitignore
```

## Conventions

- **Workspaces:** npm workspaces (`apps/*`), a single root `npm install` installs both apps.
- **Path aliases:** both apps use `@/*` → `src/*`. `apps/api`'s production build rewrites these via `tsc-alias` since plain `tsc` doesn't resolve path aliases at runtime.
- **Env vars:** one root-level `.env` shared by both apps (the API loads it explicitly via an absolute path since its process cwd differs from the root when run standalone).
- **Domain-driven backend folders:** `routes/ → controllers/ → services/` — routes stay thin, controllers parse/validate the request, services hold business logic and talk to Prisma/Redis. This structure is in place now so Milestones 6, 8, 9, 10, and 11 all extend the same pattern rather than inventing new ones.
- **Route groups (frontend):** `app/(storefront)`, `app/(auth)`, `app/account`, `app/seller`, `app/admin` will be introduced in Milestone 7 following the sitemap in [SITEMAP.md](./SITEMAP.md) — kept out of Milestone 4 since no page content exists yet.
