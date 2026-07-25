import { useAuthStore } from "@/store/auth.store";

// Prefer calling the API directly (CORS) over the Next.js rewrite proxy when
// NEXT_PUBLIC_API_URL is set — some hosts (e.g. Netlify's Next.js Runtime)
// don't reliably proxy rewrites() to an external origin. Falls back to the
// relative path (via rewrites) for local dev / hosts where that works fine.
const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
  : "/api/v1";

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

/**
 * Shared fetch wrapper: attaches the in-memory access token, and on a 401
 * transparently tries the refresh endpoint once (the refresh token lives in
 * an httpOnly cookie the browser sends automatically) before retrying.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { accessToken, setSession, clearSession } = useAuthStore.getState();

  let res = await rawRequest(path, options, accessToken);

  if (res.status === 401 && !options.skipAuthRetry) {
    const refreshed = await rawRequest("/auth/refresh", { method: "POST" }, null);
    if (refreshed.ok) {
      const data = await refreshed.json();
      setSession(data.user, data.accessToken);
      res = await rawRequest(path, options, data.accessToken);
    } else {
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
  const { accessToken, setSession, clearSession } = useAuthStore.getState();

  let res = await rawUpload(path, file, accessToken);

  if (res.status === 401) {
    const refreshed = await rawRequest("/auth/refresh", { method: "POST" }, null);
    if (refreshed.ok) {
      const data = await refreshed.json();
      setSession(data.user, data.accessToken);
      res = await rawUpload(path, file, data.accessToken);
    } else {
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
