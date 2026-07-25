import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { getPaymentProvider } from "@/services/payment";
import type { PaymentProvider } from "@prisma/client";

export const paymentWebhookService = {
  /**
   * Common path for every provider's webhook: re-verify the transaction
   * directly with the provider (never trust the webhook payload's claimed
   * status alone — webhooks can be replayed or spoofed even past signature
   * checks if a signature is somehow compromised, so this is defense in
   * depth), then mark the Payment/Order paid exactly once.
   */
  async confirmPayment(provider: PaymentProvider, providerRef: string) {
    const payment = await prisma.payment.findFirst({
      where: { providerRef, provider },
      include: { order: true },
    });

    if (!payment) {
      logger.warn("Webhook received for unknown payment reference", { provider, providerRef });
      return;
    }

    if (payment.status === "SUCCESS") {
      return; // Already processed — webhooks can be delivered more than once.
    }

    const adapter = getPaymentProvider(provider);
    const verification = await adapter.verify(providerRef);

    if (!verification.success) {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
      logger.warn("Payment verification failed", { provider, providerRef });
      return;
    }

    await prisma.$transaction([
      prisma.payment.update({ where: { id: payment.id }, data: { status: "SUCCESS" } }),
      prisma.order.update({
        where: { id: payment.orderId },
        data: {
          status: "PAID",
          statusHistory: { create: { status: "PAID", note: `Payment confirmed via ${provider}` } },
        },
      }),
    ]);

    logger.info("Payment confirmed", { provider, providerRef, orderId: payment.orderId });
  },
};
