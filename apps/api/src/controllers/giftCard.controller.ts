import type { Request, Response } from "express";
import { giftCardService } from "@/services/giftCard.service";
import { purchaseGiftCardSchema } from "@/validation/giftCard.schema";

export const giftCardController = {
  async purchase(req: Request, res: Response) {
    const input = purchaseGiftCardSchema.parse(req.body);
    const result = await giftCardService.initiatePurchase(req.user?.id ?? null, input);
    res.status(201).json(result);
  },
};
