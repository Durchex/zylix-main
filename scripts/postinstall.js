// The app no longer uses Prisma/Postgres (apps/api, the old Express service
// it belonged to, is being decommissioned in favor of Mongoose/MongoDB
// route handlers inside apps/web) — this hook is now a deliberate no-op so
// `npm install` (including Vercel's build) doesn't spend time generating a
// Prisma client nothing imports anymore. Kept as a file rather than removed
// from package.json's "postinstall" so removing apps/api later doesn't
// require touching package.json again.
process.exit(0);
