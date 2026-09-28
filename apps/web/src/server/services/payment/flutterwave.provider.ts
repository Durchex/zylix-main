import "server-only";
import crypto from "crypto";
import { env } from "@/server/config/env";
import { ApiError } from "@/server/http/errors";
import type {
  InitiatePaymentParams,
  InitiatePaymentResult,
  PaymentProviderAdapter,
  VerifyPaymentResult,
} from "./types";

const FLUTTERWAVE_BASE_URL = "https://api.flutterwave.com/v3";

interface FlutterwaveInitiateResponse {
  status: string;
  data?: { link: string };
}

interface FlutterwaveVerifyResponse {
  status: string;
  data?: { status: string; amount: number; currency: string };
}

function requireSecretKey(): string {
  if (!env.FLUTTERWAVE_SECRET_KEY) {
    throw new ApiError(503, "Flutterwave is not configured on this environment");
  }
  return env.FLUTTERWAVE_SECRET_KEY;
}

/**
 * Every call to Flutterwave goes through here.
 *
 * Two things were missing before, and both surfaced as a bare "Internal server
 * error" at checkout: no timeout, so a slow upstream held the request until the
 * platform killed it; and an unguarded `res.json()`, so any non-JSON reply
 * (a gateway error page, an HTML 502) or a dropped connection threw a raw
 * exception instead of a handled error. Both now become an ApiError with a
 * message the customer can act on.
 */
async function flutterwaveRequest<T>(path: string, init: RequestInit = {}): Promise<{ ok: boolean; body: T | null }> {
  try {
    const res = await fetch(`${FLUTTERWAVE_BASE_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${requireSecretKey()}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
      signal: AbortSignal.timeout(15_000),
    });
    const body = (await res.json().catch(() => null)) as T | null;
    return { ok: res.ok, body };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    console.error("[flutterwave] request failed", {
      path,
      error: err instanceof Error ? err.message : err,
    });
    throw new ApiError(502, "Could not reach the payment provider. Please try again in a moment.");
  }
}

export const flutterwaveProvider: PaymentProviderAdapter = {
  async initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    const txRef = `ZLX-FLW-${crypto.randomBytes(6).toString("hex")}`;

    const { ok, body } = await flutterwaveRequest<FlutterwaveInitiateResponse & { message?: string }>(
      "/payments",
      {
        method: "POST",
        body: JSON.stringify({
          tx_ref: txRef,
          amount: params.amount,
          currency: params.currency,
          redirect_url: params.redirectUrl,
          customer: { email: params.email },
          customizations: { title: "ZylixStore", description: `Order ${params.orderNumber}` },
        }),
      },
    );

    if (!ok || body?.status !== "success" || !body.data) {
      // Provider detail goes to the log, not the response — it can echo back
      // request fields and isn't something to hand to a browser.
      console.error("[flutterwave] initiate rejected", { txRef, message: body?.message, status: body?.status });
      throw new ApiError(502, "The payment provider could not start this payment. Please try again or pick another method.");
    }

    return { providerRef: txRef, status: "PENDING", checkoutUrl: body.data.link };
  },

  async verify(providerRef: string): Promise<VerifyPaymentResult> {
    const { ok, body } = await flutterwaveRequest<FlutterwaveVerifyResponse>(
      `/transactions/verify_by_reference?tx_ref=${encodeURIComponent(providerRef)}`,
    );

    if (!ok || body?.status !== "success" || !body.data) {
      return { success: false, providerRef, amount: 0, currency: "", raw: body };
    }

    return {
      success: body.data.status === "successful",
      providerRef,
      amount: body.data.amount,
      currency: body.data.currency,
      raw: body,
    };
  },
};

/**
 * Flutterwave signs webhook payloads with a static secret hash (set in the
 * dashboard, echoed back verbatim in the `verif-hash` header) — not an HMAC
 * of the body, so verification is a constant-time string comparison.
 */
export function verifyFlutterwaveWebhookSignature(headerHash: string | undefined): boolean {
  if (!env.FLUTTERWAVE_WEBHOOK_SECRET_HASH || !headerHash) return false;
  const expected = Buffer.from(env.FLUTTERWAVE_WEBHOOK_SECRET_HASH);
  const actual = Buffer.from(headerHash);
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}
