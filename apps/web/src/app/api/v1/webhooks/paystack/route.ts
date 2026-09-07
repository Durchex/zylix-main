import { withRoute } from "@/server/http/route";
import { ApiError } from "@/server/http/errors";
import { verifyPaystackWebhookSignature } from "@/server/services/payment/paystack.provider";
import { paymentWebhookService } from "@/server/services/payment/webhook.service";

export const POST = withRoute(async (req) => {
  const signature = req.headers.get("x-paystack-signature") ?? undefined;
  const rawBody = await req.text();

  if (!verifyPaystackWebhookSignature(rawBody, signature)) {
    throw new ApiError(401, "Invalid webhook signature");
  }

  const payload = JSON.parse(rawBody);
  const reference = payload?.data?.reference;
  if (payload?.event === "charge.success" && typeof reference === "string") {
    await paymentWebhookService.confirmPayment("PAYSTACK", reference);
  }

  return { received: true };
});
