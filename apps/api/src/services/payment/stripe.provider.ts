import Stripe from "stripe";
import { env } from "@/config/env";
import { ApiError } from "@/middleware/errorHandler";
import type { InitiatePaymentParams, InitiatePaymentResult, PaymentProviderAdapter, VerifyPaymentResult } from "@/services/payment/types";

let stripeClient: Stripe | null = null;

function getClient(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new ApiError(503, "Stripe is not configured on this environment");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

export const stripeProvider: PaymentProviderAdapter = {
  async initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    const stripe = getClient();

    // Stripe Checkout Sessions give a hosted redirect URL, matching
    // Flutterwave/Paystack's flow shape so the frontend has one integration
    // pattern ("redirect to checkoutUrl") across all three providers,
    // instead of a separate Stripe Elements/client-secret code path.
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: params.email,
      line_items: [
        {
          price_data: {
            currency: params.currency.toLowerCase(),
            product_data: { name: `Zylix Order ${params.orderNumber}` },
            unit_amount: Math.round(params.amount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${params.redirectUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: params.redirectUrl,
      metadata: { orderId: params.orderId, orderNumber: params.orderNumber },
    });

    if (!session.url) {
      throw new ApiError(502, "Failed to initiate Stripe checkout session");
    }

    return { providerRef: session.id, status: "PENDING", checkoutUrl: session.url };
  },

  async verify(providerRef: string): Promise<VerifyPaymentResult> {
    const stripe = getClient();
    const session = await stripe.checkout.sessions.retrieve(providerRef);

    return {
      success: session.payment_status === "paid",
      providerRef,
      amount: (session.amount_total ?? 0) / 100,
      currency: (session.currency ?? "").toUpperCase(),
      raw: session,
    };
  },
};

export function verifyStripeWebhookSignature(rawBody: string | Buffer, signatureHeader: string | undefined) {
  if (!env.STRIPE_WEBHOOK_SECRET || !signatureHeader) {
    throw new ApiError(503, "Stripe webhooks are not configured on this environment");
  }
  const stripe = getClient();
  // Throws Stripe.errors.StripeSignatureVerificationError on mismatch — the
  // caller is expected to let that propagate to the error handler as a 400.
  return stripe.webhooks.constructEvent(rawBody, signatureHeader, env.STRIPE_WEBHOOK_SECRET);
}
