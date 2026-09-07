import "server-only";

/**
 * The API used to be a separate Express service reached over the network at
 * API_URL; it's now implemented as route handlers in this same Next.js app
 * (src/app/api/v1/**). Server Components still reach it over HTTP rather
 * than importing the service layer directly — Vercel serverless functions
 * can call their own deployment's public URL, and doing it this way keeps
 * every existing page's call site (`serverApiRequest("/products?...")`)
 * unchanged.
 *
 * Resolution order: APP_URL (explicit, what's set in Vercel/local .env) →
 * VERCEL_URL (Vercel sets this automatically per-deployment, without a
 * protocol) → localhost for `next dev`.
 */
function resolveBaseUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

interface ServerFetchOptions {
  revalidate?: number | false;
  tags?: string[];
}

/**
 * Server Component / Route Handler fetch helper — talks to this app's own
 * /api/v1 route handlers for public, unauthenticated catalog data so
 * listing/detail pages can be server-rendered for SEO and Core Web Vitals.
 */
export async function serverApiRequest<T>(
  path: string,
  options: ServerFetchOptions = {},
): Promise<T | null> {
  const url = `${resolveBaseUrl()}/api/v1${path}`;
  try {
    const res = await fetch(url, {
      next: { revalidate: options.revalidate ?? 60, tags: options.tags },
      // Without this, an unreachable API hangs this fetch indefinitely —
      // and since callers await it directly on the render path (no
      // Suspense boundary, see ProductRail), the whole page hangs with it,
      // which upstream platforms observe as a request timeout (502) rather
      // than the graceful empty-state this try/catch is meant to produce.
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.warn("[serverApiRequest] non-ok response", { url, status: res.status, statusText: res.statusText });
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    // A temporarily unavailable catalog API should render the caller's empty
    // state instead of triggering Next.js's development error overlay.
    console.warn("[serverApiRequest] fetch failed", { url, error: err instanceof Error ? err.message : String(err) });
    return null;
  }
}
