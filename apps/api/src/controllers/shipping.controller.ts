import type { Request, Response } from "express";
import { shippingService } from "@/services/shipping.service";
import { shippingQuoteQuerySchema } from "@/validation/shipping.schema";

export const shippingController = {
  async getQuote(req: Request, res: Response) {
    const query = shippingQuoteQuerySchema.parse(req.query);
    const quote = await shippingService.getQuote(query.state, query.subtotal);
    res.status(200).json({ quote });
  },
};
