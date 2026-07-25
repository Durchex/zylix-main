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
    });

    if (!res.ok) {
      // Temporary diagnostic logging — this path silently returned null with
      // zero visibility into why on Netlify. Remove once the root cause of
      // products not showing on the homepage is confirmed and fixed.
      console.error("[serverApiRequest] non-ok response", { url, status: res.status, statusText: res.statusText });
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error("[serverApiRequest] fetch threw", { url, error: err instanceof Error ? err.message : String(err) });
    return null;
  }
}
