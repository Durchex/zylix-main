import "server-only";
import crypto from "crypto";
import { getEnv } from "@/server/config/env";
import { ApiError } from "@/server/http/errors";

/**
 * Whether Shipbubble is usable on this environment. Callers use this to fall
 * back to the flat-rate ShippingZone quote rather than failing checkout —
 * same shape as isCloudinaryConfigured().
 */
export function isShipbubbleConfigured(): boolean {
  return Boolean(getEnv().SHIPBUBBLE_API_KEY);
}

function requireApiKey(): string {
  const key = getEnv().SHIPBUBBLE_API_KEY;
  if (!key) {
    throw new ApiError(503, "Logistics is not configured on this environment");
  }
  return key;
}

/** Shipbubble wraps every response in { status, message, data }. */
interface ShipbubbleEnvelope<T> {
  status: string;
  message: string;
  data: T;
}

/**
 * Single call point for the Shipbubble REST API.
 *
 * Their errors are surfaced as an ApiError carrying only Shipbubble's own
 * `message`, never the raw payload — the body can echo back address and
 * contact details we shouldn't be relaying to a browser.
 */
export async function shipbubbleRequest<T>(
  path: string,
  init: { method?: "GET" | "POST" | "PUT"; body?: unknown } = {},
): Promise<T> {
  const env = getEnv();
  const url = `${env.SHIPBUBBLE_BASE_URL}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: init.method ?? "GET",
      headers: {
        Authorization: `Bearer ${requireApiKey()}`,
        "Content-Type": "application/json",
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      // Rates are quoted live at checkout; a hung upstream must not hold the
      // request open until the platform's own function timeout.
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    console.error("[shipbubble] request failed", { path, error: err instanceof Error ? err.message : err });
    throw new ApiError(502, "Could not reach the delivery service. Please try again.");
  }

  const payload = (await response.json().catch(() => null)) as ShipbubbleEnvelope<T> | null;

  if (!response.ok || !payload || payload.status !== "success") {
    const message = payload?.message ?? `Delivery service returned ${response.status}`;
    console.error("[shipbubble] error response", { path, status: response.status, message });
    // 4xx from Shipbubble is usually a bad address or an unserviceable route
    // — a client problem worth showing; anything else is ours to own.
    throw new ApiError(response.status >= 400 && response.status < 500 ? 400 : 502, message);
  }

  return payload.data;
}

/**
 * Verifies a Shipbubble webhook. They HMAC-SHA512 the raw request body using
 * the API key as the secret and send it in `x-ship-signature`.
 *
 * Compared with timingSafeEqual so a wrong signature can't be discovered a
 * byte at a time by timing the response.
 */
export function verifyShipbubbleWebhook(rawBody: string, signature: string | null): boolean {
  const key = getEnv().SHIPBUBBLE_API_KEY;
  if (!key || !signature) return false;

  const expected = crypto.createHmac("sha512", key).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== providedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}
