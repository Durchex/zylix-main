import { withRoute } from "@/server/http/route";
import { ApiError } from "@/server/http/errors";
import { verifyStripeWebhookSignature } from "@/server/services/payment/stripe.provider";
import { paymentWebhookService } from "@/server/services/payment/webhook.service";

export const POST = withRoute(async (req) => {
  const signature = req.headers.get("stripe-signature") ?? undefined;
  const rawBody = await req.text();

  let event;
  try {
    event = verifyStripeWebhookSignature(rawBody, signature);
  } catch (err) {
    // Preserve ApiError's own status (e.g. 503 when Stripe isn't
    // configured) — only a genuine signature mismatch from the Stripe SDK
    // should be reported as 401, otherwise a config problem masquerades as
    // a security incident.
    if (err instanceof ApiError) throw err;
    console.warn("[webhook] stripe signature verification failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    throw new ApiError(401, "Invalid webhook signature");
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as { id: string };
    await paymentWebhookService.confirmPayment("STRIPE", session.id);
  }

  return { received: true };
});
