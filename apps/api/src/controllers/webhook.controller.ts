import type { Request, Response } from "express";
import { ApiError } from "@/middleware/errorHandler";
import { logger } from "@/lib/logger";
import { verifyFlutterwaveWebhookSignature } from "@/services/payment/flutterwave.provider";
import { verifyPaystackWebhookSignature } from "@/services/payment/paystack.provider";
import { verifyStripeWebhookSignature } from "@/services/payment/stripe.provider";
import { paymentWebhookService } from "@/services/payment/webhook.service";

function rawBodyOf(req: Request): Buffer {
  // Populated by the express.raw() middleware mounted ahead of these routes
  // (see app.ts) — signature verification needs the exact bytes, not a
  // re-serialized JSON.parse(...) round-trip.
  return req.body as Buffer;
}

export const webhookController = {
  async flutterwave(req: Request, res: Response) {
    const signature = req.headers["verif-hash"] as string | undefined;
    if (!verifyFlutterwaveWebhookSignature(signature)) {
      throw new ApiError(401, "Invalid webhook signature");
    }

    const payload = JSON.parse(rawBodyOf(req).toString("utf8"));
    const txRef = payload?.data?.tx_ref;
    if (typeof txRef === "string") {
      await paymentWebhookService.confirmPayment("FLUTTERWAVE", txRef);
    }

    res.status(200).json({ received: true });
  },

  async paystack(req: Request, res: Response) {
    const signature = req.headers["x-paystack-signature"] as string | undefined;
    const rawBody = rawBodyOf(req);

    if (!verifyPaystackWebhookSignature(rawBody.toString("utf8"), signature)) {
      throw new ApiError(401, "Invalid webhook signature");
    }

    const payload = JSON.parse(rawBody.toString("utf8"));
    const reference = payload?.data?.reference;
    if (payload?.event === "charge.success" && typeof reference === "string") {
      await paymentWebhookService.confirmPayment("PAYSTACK", reference);
    }

    res.status(200).json({ received: true });
  },

  async stripe(req: Request, res: Response) {
    const signature = req.headers["stripe-signature"] as string | undefined;

    let event;
    try {
      event = verifyStripeWebhookSignature(rawBodyOf(req), signature);
    } catch (err) {
      // Preserve ApiError's own status (e.g. 503 when Stripe isn't
      // configured) — only a genuine signature mismatch from the Stripe SDK
      // should be reported as 401, otherwise a config problem masquerades
      // as a security incident.
      if (err instanceof ApiError) throw err;
      logger.warn("Stripe webhook signature verification failed", {
        error: err instanceof Error ? err.message : String(err),
      });
      throw new ApiError(401, "Invalid webhook signature");
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as { id: string };
      await paymentWebhookService.confirmPayment("STRIPE", session.id);
    }

    res.status(200).json({ received: true });
  },
};
