import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import type { PurchaseGiftCardInput } from "@/validation/giftCard.schema";

function generateGiftCardCode(): string {
  return `ZLXGC-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
}

export const giftCardService = {
  /**
   * Creates the gift card record in an inactive state — Milestone 11's
   * payment webhook is what flips `isActive` once the charge is confirmed.
   * No funds move here; this is the pre-payment reservation step.
   */
  async initiatePurchase(purchasedByUserId: string | null, input: PurchaseGiftCardInput) {
    const giftCard = await prisma.giftCard.create({
      data: {
        code: generateGiftCardCode(),
        initialBalance: input.amount,
        currentBalance: input.amount,
        issuedToEmail: input.recipientEmail,
        senderName: input.senderName,
        message: input.message,
        purchasedByUserId,
        isActive: false,
      },
    });
    return { giftCardId: giftCard.id };
  },
};
