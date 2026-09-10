import "server-only";
import crypto from "crypto";
import { getEnv } from "@/server/config/env";
import { ApiError } from "@/server/http/errors";

/**
 * NOWPayments client.
 *
 * Both the API key and the IPN secret are required before crypto is offered:
 * the key creates invoices, and the secret is what makes a callback
 * trustworthy. With an invoice but no way to verify the callback, we'd have
 * no safe way to learn the payment succeeded.
 */
export function isCryptoConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.NOWPAYMENTS_API_KEY && env.NOWPAYMENTS_IPN_SECRET);
}

function requireApiKey(): string {
  const key = getEnv().NOWPAYMENTS_API_KEY;
  if (!key) {
    throw new ApiError(503, "Crypto payments are not configured on this environment");
  }
  return key;
}

async function nowPaymentsRequest<T>(
  path: string,
  init: { method?: "GET" | "POST"; body?: unknown } = {},
): Promise<T> {
  const env = getEnv();

  let response: Response;
  try {
    response = await fetch(`${env.NOWPAYMENTS_BASE_URL}${path}`, {
      method: init.method ?? "GET",
      headers: {
        // NOWPayments authenticates with a bare API key header, not a bearer
        // token.
        "x-api-key": requireApiKey(),
        "Content-Type": "application/json",
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    console.error("[nowpayments] request failed", {
      path,
      error: err instanceof Error ? err.message : err,
    });
    throw new ApiError(502, "Could not reach the crypto payment provider. Please try again.");
  }

  const payload = (await response.json().catch(() => null)) as (T & { message?: string }) | null;

  if (!response.ok || !payload) {
    const message = payload?.message ?? `Crypto provider returned ${response.status}`;
    console.error("[nowpayments] error response", { path, status: response.status, message });
    throw new ApiError(502, "Could not start the crypto payment. Please try another method.");
  }

  return payload;
}

export interface NowPaymentsInvoice {
  id: string;
  invoice_url: string;
  order_id: string;
  price_amount: string;
  price_currency: string;
}

export interface NowPaymentsPayment {
  payment_id: string | number;
  payment_status: string;
  price_amount: number;
  price_currency: string;
  actually_paid?: number;
  order_id?: string;
}

export const nowPayments = {
  /**
   * Creates a hosted invoice. Prices are sent in the store's own currency —
   * NOWPayments quotes the crypto side and handles conversion, so nothing
   * here has to know exchange rates.
   */
  createInvoice(input: {
    priceAmount: number;
    priceCurrency: string;
    orderId: string;
    orderDescription: string;
    ipnCallbackUrl: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<NowPaymentsInvoice> {
    return nowPaymentsRequest<NowPaymentsInvoice>("/invoice", {
      method: "POST",
      body: {
        price_amount: input.priceAmount,
        price_currency: input.priceCurrency,
        order_id: input.orderId,
        order_description: input.orderDescription,
        ipn_callback_url: input.ipnCallbackUrl,
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
      },
    });
  },

  getPayment(paymentId: string): Promise<NowPaymentsPayment> {
    return nowPaymentsRequest<NowPaymentsPayment>(`/payment/${encodeURIComponent(paymentId)}`);
  },
};

/**
 * Recursively sorts object keys.
 *
 * NOWPayments signs the JSON of the *key-sorted* payload rather than the raw
 * body, so the same sort has to be reproduced here before hashing or the
 * signature never matches. Arrays keep their order — only object keys sort.
 */
function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortDeep((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return value;
}

/**
 * Verifies an IPN callback against the `x-nowpayments-sig` header.
 *
 * Takes the parsed payload rather than the raw body precisely because the
 * signature is over re-serialised sorted JSON, not the bytes as sent.
 */
export function verifyNowPaymentsSignature(payload: unknown, signature: string | null): boolean {
  const secret = getEnv().NOWPAYMENTS_IPN_SECRET;
  if (!secret || !signature) return false;

  const expected = crypto
    .createHmac("sha512", secret)
    .update(JSON.stringify(sortDeep(payload)))
    .digest("hex");

  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== providedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

/**
 * Statuses that mean the customer's funds have actually landed.
 *
 * `confirming` and `sending` are deliberately excluded — the transaction is
 * still in flight and can fail. `partially_paid` is excluded too: the
 * customer underpaid, so the order shouldn't be treated as settled.
 */
export const SETTLED_PAYMENT_STATUSES = new Set(["finished", "confirmed"]);

/** Statuses that mean the payment will never complete. */
export const FAILED_PAYMENT_STATUSES = new Set(["failed", "refunded", "expired"]);
