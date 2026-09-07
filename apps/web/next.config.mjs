/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Vercel does its own build tracing and ignores `output: "standalone"` —
  // left unset now that Vercel is the only deploy target. (It previously
  // also produced the apps/web/.next/standalone/ bundle apps/web/Dockerfile
  // copied into a self-hosted image; that path is gone along with Render.)
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
  // The API used to be a separate Express service, reached by rewriting
  // /api/* to its external URL (API_URL). It's now implemented directly as
  // route handlers under src/app/api/v1/**, in this same Next.js app, so
  // there's nothing left to proxy — keeping the rewrite would have shadowed
  // those routes (a request matching a dynamic API segment resolves after
  // rewrites run, so it would've been sent to a now-nonexistent external
  // API instead of the local handler).
  async rewrites() {
    return [
      {
        source: "/favicon.ico",
        destination: "/icon",
      },
    ];
  },
};

export default nextConfig;
