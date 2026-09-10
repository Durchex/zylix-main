import "server-only";
import { env } from "@/server/config/env";
import {
  nowPayments,
  isCryptoConfigured,
  SETTLED_PAYMENT_STATUSES,
} from "@/server/lib/nowpayments";
import { ApiError } from "@/server/http/errors";
import type {
  InitiatePaymentParams,
  InitiatePaymentResult,
  PaymentProviderAdapter,
  VerifyPaymentResult,
} from "./types";

/**
 * Crypto payments via NOWPayments' hosted invoice.
 *
 * The customer is redirected to an invoice page where they choose a coin and
 * are given an address; NOWPayments handles the conversion and tells us the
 * outcome over a signed IPN callback. Prices go out in the store's own
 * currency, so nothing here deals in exchange rates.
 */
export const cryptoProvider: PaymentProviderAdapter = {
  async initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    if (!isCryptoConfigured()) {
      throw new ApiError(503, "Crypto payments are not configured on this environment");
    }

    const invoice = await nowPayments.createInvoice({
      priceAmount: params.amount,
      priceCurrency: params.currency,
      // Our order number, echoed back on every callback — the join key when
      // reconciling a payment by hand.
      orderId: params.orderNumber,
      orderDescription: `ZylixStore order ${params.orderNumber}`,
      ipnCallbackUrl: `${env.APP_URL}/api/v1/webhooks/nowpayments`,
      successUrl: params.redirectUrl,
      // Cancelling drops them back at checkout with the cart intact rather
      // than at a dead end.
      cancelUrl: `${env.APP_URL}/checkout/payment`,
    });

    return {
      providerRef: String(invoice.id),
      status: "PENDING",
      checkoutUrl: invoice.invoice_url,
    };
  },

  /**
   * Re-checks a payment with NOWPayments.
   *
   * `providerRef` is the invoice id at first, and is replaced with the
   * concrete payment id once the customer picks a coin and the first IPN
   * arrives — only then is there a payment to look up. Called before an
   * invoice has become a payment, this reports "not settled yet" rather than
   * treating an unknown id as a failure.
   */
  async verify(providerRef: string): Promise<VerifyPaymentResult> {
    try {
      const payment = await nowPayments.getPayment(providerRef);
      return {
        success: SETTLED_PAYMENT_STATUSES.has(payment.payment_status),
        providerRef,
        amount: payment.price_amount,
        currency: payment.price_currency,
        raw: payment,
      };
    } catch (err) {
      console.warn("[crypto] could not verify payment", {
        providerRef,
        error: err instanceof Error ? err.message : err,
      });
      return { success: false, providerRef, amount: 0, currency: "", raw: null };
    }
  },
};
