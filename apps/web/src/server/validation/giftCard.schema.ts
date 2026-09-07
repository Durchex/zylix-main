import { z } from "zod";

export const purchaseGiftCardSchema = z.object({
  amount: z.number().min(1000, "Minimum gift card amount is ₦1,000").max(1_000_000),
  recipientEmail: z.string().trim().toLowerCase().email(),
  senderName: z.string().trim().min(1),
  message: z.string().trim().max(300).optional(),
});
export type PurchaseGiftCardInput = z.infer<typeof purchaseGiftCardSchema>;
