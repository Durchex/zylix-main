import { withRoute } from "@/server/http/route";
import { ApiError } from "@/server/http/errors";
import { verifyFlutterwaveWebhookSignature } from "@/server/services/payment/flutterwave.provider";
import { paymentWebhookService } from "@/server/services/payment/webhook.service";

export const POST = withRoute(async (req) => {
  const signature = req.headers.get("verif-hash") ?? undefined;
  if (!verifyFlutterwaveWebhookSignature(signature)) {
    throw new ApiError(401, "Invalid webhook signature");
  }

  // Route handlers never parse the body implicitly (unlike Express, which
  // needed express.raw() ahead of the global express.json() to preserve the
  // exact bytes) — req.text() here already is the raw, unparsed payload.
  const rawBody = await req.text();
  const payload = JSON.parse(rawBody);
  const txRef = payload?.data?.tx_ref;
  if (typeof txRef === "string") {
    await paymentWebhookService.confirmPayment("FLUTTERWAVE", txRef);
  }

  return { received: true };
});
