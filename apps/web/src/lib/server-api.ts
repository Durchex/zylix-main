import "server-only";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

interface ServerFetchOptions {
  revalidate?: number | false;
  tags?: string[];
}

/**
 * Server Component / Route Handler fetch helper — talks to the API directly
 * (not through the browser rewrite proxy, since there's no browser here) for
 * public, unauthenticated catalog data so listing/detail pages can be
 * server-rendered for SEO and Core Web Vitals.
 */
export async function serverApiRequest<T>(
  path: string,
  options: ServerFetchOptions = {},
): Promise<T | null> {
  const url = `${API_URL}/api/v1${path}`;
  try {
    const res = await fetch(url, {
      next: { revalidate: options.revalidate ?? 60, tags: options.tags },
      // Without this, a cold/unreachable API hangs this fetch indefinitely —
      // and since callers await it directly on the render path (no
      // Suspense boundary, see ProductRail), the whole page hangs with it,
      // which upstream platforms observe as a request timeout (502) rather
      // than the graceful empty-state this try/catch is meant to produce.
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      // Temporary diagnostic logging — this path silently returned null with
      // zero visibility into why on Netlify. Remove once the root cause of
      // products not showing on the homepage is confirmed and fixed.
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
