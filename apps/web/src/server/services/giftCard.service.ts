import "server-only";
import crypto from "crypto";
import { GiftCard } from "@/server/models";
import type { PurchaseGiftCardInput } from "@/server/validation/giftCard.schema";

function generateGiftCardCode(): string {
  return `ZLXGC-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
}

export const giftCardService = {
  /**
   * Creates the gift card record in an inactive state — the payment webhook
   * is what flips `isActive` once the charge is confirmed. No funds move
   * here; this is the pre-payment reservation step.
   */
  async initiatePurchase(purchasedByUserId: string | null, input: PurchaseGiftCardInput) {
    const giftCard = await GiftCard.create({
      code: generateGiftCardCode(),
      initialBalance: input.amount,
      currentBalance: input.amount,
      issuedToEmail: input.recipientEmail,
      senderName: input.senderName,
      message: input.message,
      purchasedByUserId,
      isActive: false,
    });
    return { giftCardId: String(giftCard._id) };
  },
};
