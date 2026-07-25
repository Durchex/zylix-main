import path from "node:path";

const apiUrl = process.env.API_URL ?? "http://localhost:4000";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Produces a minimal apps/web/.next/standalone/ bundle with only the
  // production dependencies actually traced from the build — what
  // apps/web/Dockerfile copies into the runtime image. Vercel ignores this
  // (it does its own build tracing), so it's safe for both targets.
  output: "standalone",
  // node_modules are hoisted to the monorepo root under npm workspaces —
  // without this, Next's file tracer roots itself at apps/web and misses
  // hoisted dependencies in the standalone build.
  outputFileTracingRoot: path.join(process.cwd(), "../../"),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
    // Only for locally-authored placeholder assets under public/seed/ (used
    // by the dev seed script) — never for user-uploaded or remote SVGs.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
