import crypto from "crypto";
import { env } from "@/config/env";
import { ApiError } from "@/middleware/errorHandler";
import type { InitiatePaymentParams, InitiatePaymentResult, PaymentProviderAdapter, VerifyPaymentResult } from "@/services/payment/types";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

interface PaystackInitiateResponse {
  status: boolean;
  data?: { authorization_url: string };
}

interface PaystackVerifyResponse {
  status: boolean;
  data?: { status: string; amount: number; currency: string };
}

function requireSecretKey(): string {
  if (!env.PAYSTACK_SECRET_KEY) {
    throw new ApiError(503, "Paystack is not configured on this environment");
  }
  return env.PAYSTACK_SECRET_KEY;
}

export const paystackProvider: PaymentProviderAdapter = {
  async initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    const secretKey = requireSecretKey();
    const reference = `ZLX-PSK-${crypto.randomBytes(6).toString("hex")}`;

    const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reference,
        // Paystack expects the smallest currency unit (kobo for NGN).
        amount: Math.round(params.amount * 100),
        currency: params.currency,
        email: params.email,
        callback_url: params.redirectUrl,
      }),
    });

    const data = (await res.json()) as PaystackInitiateResponse;
    if (!res.ok || !data.status || !data.data) {
      throw new ApiError(502, "Failed to initiate Paystack payment", data);
    }

    return { providerRef: reference, status: "PENDING", checkoutUrl: data.data.authorization_url };
  },

  async verify(providerRef: string): Promise<VerifyPaymentResult> {
    const secretKey = requireSecretKey();

    const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(providerRef)}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });

    const data = (await res.json()) as PaystackVerifyResponse;
    if (!res.ok || !data.status || !data.data) {
      return { success: false, providerRef, amount: 0, currency: "", raw: data };
    }

    return {
      success: data.data.status === "success",
      providerRef,
      amount: data.data.amount / 100,
      currency: data.data.currency,
      raw: data,
    };
  },
};

/** Paystack signs webhooks with HMAC-SHA512 of the raw body, using the secret key itself. */
export function verifyPaystackWebhookSignature(rawBody: string, headerSignature: string | undefined): boolean {
  if (!env.PAYSTACK_SECRET_KEY || !headerSignature) return false;
  const expected = crypto.createHmac("sha512", env.PAYSTACK_SECRET_KEY).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(headerSignature);
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}
