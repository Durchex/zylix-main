import { useAuthStore } from "@/store/auth.store";

// The API lives in this same Next.js app (src/app/api/v1/**), so the browser
// always calls it same-origin — no external URL or CORS configuration needed.
const API_BASE = "/api/v1";

export class ApiRequestError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  skipAuthRetry?: boolean;
}

async function rawRequest(path: string, options: RequestOptions, accessToken: string | null) {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  return fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers,
    credentials: "include",
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}

type RefreshOutcome = "refreshed" | "expired" | "unavailable";

let refreshInFlight: Promise<RefreshOutcome> | null = null;

/**
 * Exchanges the refresh cookie for a new session — at most once at a time.
 *
 * The server rotates the refresh token on every use, so two overlapping
 * refreshes both present the same cookie and the second one arrives after the
 * first has already revoked it. That second call gets a 401, which used to be
 * read as "you're logged out". Concurrent callers (the session bootstrap, a
 * request that just 401'd, a second tab's fetch) now share one request and all
 * see its result.
 *
 * The outcome distinguishes a definitive answer from a transient one. Only
 * "expired" — the server explicitly said the session is invalid — should log
 * anyone out. A 500 or a dropped connection says nothing about whether the
 * session is still good, so it must not clear it.
 */
export function refreshSession(): Promise<RefreshOutcome> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async (): Promise<RefreshOutcome> => {
    try {
      const res = await rawRequest("/auth/refresh", { method: "POST" }, null);
      if (res.ok) {
        const data = await res.json();
        useAuthStore.getState().setSession(data.user, data.accessToken);
        return "refreshed";
      }
      return res.status === 401 ? "expired" : "unavailable";
    } catch {
      return "unavailable";
    } finally {
      // Cleared the moment it settles. Callers already awaiting this promise
      // still get its result — they hold a reference — while anyone arriving
      // afterwards starts a genuinely new refresh instead of being handed an
      // old answer. (Deferring this to a timer let a caller landing just after
      // completion inherit a stale result.)
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/**
 * Shared fetch wrapper: attaches the in-memory access token, and on a 401
 * transparently tries the refresh endpoint once (the refresh token lives in
 * an httpOnly cookie the browser sends automatically) before retrying.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { accessToken, clearSession } = useAuthStore.getState();

  let res = await rawRequest(path, options, accessToken);

  if (res.status === 401 && !options.skipAuthRetry) {
    const outcome = await refreshSession();
    if (outcome === "refreshed") {
      res = await rawRequest(path, options, useAuthStore.getState().accessToken);
    } else if (outcome === "expired") {
      clearSession();
    }
  }

  const contentType = res.headers.get("content-type");
  const payload = contentType?.includes("application/json") ? await res.json() : null;

  if (!res.ok) {
    throw new ApiRequestError(
      res.status,
      payload?.error?.message ?? "Something went wrong. Please try again.",
      payload?.error?.details ?? payload?.error?.issues,
    );
  }

  return payload as T;
}

async function rawUpload(path: string, file: File, accessToken: string | null) {
  const formData = new FormData();
  formData.append("file", file);

  const headers: Record<string, string> = {};
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  // No Content-Type header here — the browser sets the correct multipart
  // boundary itself when the body is a FormData instance.
  return fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    credentials: "include",
    body: formData,
  });
}

/**
 * Same 401-refresh-retry behavior as apiRequest, but for multipart file
 * uploads (apiRequest always JSON-encodes its body, which doesn't work for
 * File/Blob payloads).
 */
export async function uploadFile(path: string, file: File): Promise<{ url: string }> {
  const { accessToken, clearSession } = useAuthStore.getState();

  let res = await rawUpload(path, file, accessToken);

  if (res.status === 401) {
    const outcome = await refreshSession();
    if (outcome === "refreshed") {
      res = await rawUpload(path, file, useAuthStore.getState().accessToken);
    } else if (outcome === "expired") {
      clearSession();
    }
  }

  const contentType = res.headers.get("content-type");
  const payload = contentType?.includes("application/json") ? await res.json() : null;

  if (!res.ok) {
    throw new ApiRequestError(res.status, payload?.error?.message ?? "Upload failed. Please try again.");
  }

  return payload as { url: string };
}
