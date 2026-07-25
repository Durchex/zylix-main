import type { Request, Response } from "express";
import { newsletterService } from "@/services/newsletter.service";
import { unsubscribeSchema } from "@/validation/newsletter.schema";

export const newsletterController = {
  async unsubscribe(req: Request, res: Response) {
    const input = unsubscribeSchema.parse(req.body);
    await newsletterService.unsubscribe(input.email);
    res.status(200).json({ message: "Unsubscribed successfully." });
  },
};
