import type { Request, Response } from "express";
import { sellerOrderService } from "@/services/seller/order.service";
import {
  sellerOrderListQuerySchema,
  updateFulfillmentSchema,
} from "@/validation/seller/order.schema";

export const sellerOrderController = {
  async list(req: Request, res: Response) {
    const query = sellerOrderListQuerySchema.parse(req.query);
    const result = await sellerOrderService.list(req.seller!.id, query);
    res.status(200).json(result);
  },

  async getById(req: Request, res: Response) {
    const order = await sellerOrderService.getById(req.seller!.id, req.params.orderId!);
    res.status(200).json({ order });
  },

  async updateFulfillment(req: Request, res: Response) {
    const input = updateFulfillmentSchema.parse(req.body);
    const item = await sellerOrderService.updateItemFulfillment(
      req.seller!.id,
      req.params.orderId!,
      req.params.itemId!,
      input,
    );
    res.status(200).json({ item });
  },
};
