import "server-only";
import { getPaymentProvider } from "@/server/services/payment";
import { Payment, Order, OrderStatusHistory } from "@/server/models";
import type { PaymentProvider } from "@/server/models/enums";

export const paymentWebhookService = {
  /**
   * Common path for every provider's webhook: re-verify the transaction
   * directly with the provider (never trust the webhook payload's claimed
   * status alone — webhooks can be replayed or spoofed even past signature
   * checks if a signature is somehow compromised, so this is defense in
   * depth), then mark the Payment/Order paid exactly once.
   */
  async confirmPayment(provider: PaymentProvider, providerRef: string) {
    const payment = await Payment.findOne({ providerRef, provider });

    if (!payment) {
      console.warn("[webhook] received for unknown payment reference", { provider, providerRef });
      return;
    }

    if (payment.status === "SUCCESS") {
      return; // Already processed — webhooks can be delivered more than once.
    }

    const adapter = getPaymentProvider(provider);
    const verification = await adapter.verify(providerRef);

    if (!verification.success) {
      await Payment.updateOne({ _id: payment._id }, { status: "FAILED" });
      console.warn("[webhook] payment verification failed", { provider, providerRef });
      return;
    }

    await Payment.updateOne({ _id: payment._id }, { status: "SUCCESS" });
    await Order.updateOne({ _id: payment.orderId }, { status: "PAID" });
    await OrderStatusHistory.create({
      orderId: payment.orderId,
      status: "PAID",
      note: `Payment confirmed via ${provider}`,
    });

    console.info("[webhook] payment confirmed", { provider, providerRef, orderId: String(payment.orderId) });
  },
};
