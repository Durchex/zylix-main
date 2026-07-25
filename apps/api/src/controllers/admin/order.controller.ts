import type { Request, Response } from "express";
import { adminOrderService } from "@/services/admin/order.service";
import { adminOrderListQuerySchema, updateOrderStatusSchema } from "@/validation/admin/order.schema";

export const adminOrderController = {
  async list(req: Request, res: Response) {
    const query = adminOrderListQuerySchema.parse(req.query);
    const result = await adminOrderService.list(query);
    res.status(200).json(result);
  },

  async getById(req: Request, res: Response) {
    const order = await adminOrderService.getById(req.params.id!);
    res.status(200).json({ order });
  },

  async updateStatus(req: Request, res: Response) {
    const input = updateOrderStatusSchema.parse(req.body);
    const order = await adminOrderService.updateStatus(req.params.id!, input, req.user!.id);
    res.status(200).json({ order });
  },
};
