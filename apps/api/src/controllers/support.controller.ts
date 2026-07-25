import type { Request, Response } from "express";
import { supportService } from "@/services/support.service";
import { contactMessageSchema } from "@/validation/support.schema";

export const supportController = {
  async submitContact(req: Request, res: Response) {
    const input = contactMessageSchema.parse(req.body);
    await supportService.submitContactMessage(input);
    res.status(201).json({ message: "Your message has been received." });
  },
};
