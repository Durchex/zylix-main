import crypto from "crypto";
import { env } from "@/config/env";
import { ApiError } from "@/middleware/errorHandler";
import type { InitiatePaymentParams, InitiatePaymentResult, PaymentProviderAdapter, VerifyPaymentResult } from "@/services/payment/types";

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

export const flutterwaveProvider: PaymentProviderAdapter = {
  async initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    const secretKey = requireSecretKey();
    const txRef = `ZLX-FLW-${crypto.randomBytes(6).toString("hex")}`;

    const res = await fetch(`${FLUTTERWAVE_BASE_URL}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: params.amount,
        currency: params.currency,
        redirect_url: params.redirectUrl,
        customer: { email: params.email },
        customizations: { title: "Zylix", description: `Order ${params.orderNumber}` },
      }),
    });

    const data = (await res.json()) as FlutterwaveInitiateResponse;
    if (!res.ok || data.status !== "success" || !data.data) {
      throw new ApiError(502, "Failed to initiate Flutterwave payment", data);
    }

    return { providerRef: txRef, status: "PENDING", checkoutUrl: data.data.link };
  },

  async verify(providerRef: string): Promise<VerifyPaymentResult> {
    const secretKey = requireSecretKey();

    const res = await fetch(
      `${FLUTTERWAVE_BASE_URL}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(providerRef)}`,
      { headers: { Authorization: `Bearer ${secretKey}` } },
    );

    const data = (await res.json()) as FlutterwaveVerifyResponse;
    if (!res.ok || data.status !== "success" || !data.data) {
      return { success: false, providerRef, amount: 0, currency: "", raw: data };
    }

    return {
      success: data.data.status === "successful",
      providerRef,
      amount: data.data.amount,
      currency: data.data.currency,
      raw: data,
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
