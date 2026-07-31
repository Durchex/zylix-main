import type { Request, Response } from "express";
import { newsletterService } from "@/services/newsletter.service";
import { subscribeSchema, unsubscribeSchema } from "@/validation/newsletter.schema";

export const newsletterController = {
  async subscribe(req: Request, res: Response) {
    const input = subscribeSchema.parse(req.body);
    await newsletterService.subscribe(input.email);
    res.status(201).json({ message: "Subscribed successfully." });
  },

  async unsubscribe(req: Request, res: Response) {
    const input = unsubscribeSchema.parse(req.body);
    await newsletterService.unsubscribe(input.email);
    res.status(200).json({ message: "Unsubscribed successfully." });
  },
};
