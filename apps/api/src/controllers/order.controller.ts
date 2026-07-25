import type { Request, Response } from "express";
import { orderService } from "@/services/order.service";
import {
  createOrderSchema,
  orderTrackingQuerySchema,
  myOrderListQuerySchema,
} from "@/validation/order.schema";

export const orderController = {
  async create(req: Request, res: Response) {
    const input = createOrderSchema.parse(req.body);
    const result = await orderService.createOrder(req.user!.id, input);
    res.status(201).json(result);
  },

  async getConfirmation(req: Request, res: Response) {
    const order = await orderService.getConfirmation(req.params.orderId!);
    res.status(200).json({ order });
  },

  async track(req: Request, res: Response) {
    const query = orderTrackingQuerySchema.parse(req.query);
    const order = await orderService.track(query.orderNumber, query.email);
    res.status(200).json({ order });
  },

  async listMine(req: Request, res: Response) {
    const query = myOrderListQuerySchema.parse(req.query);
    const result = await orderService.listMine(req.user!.id, query);
    res.status(200).json(result);
  },

  async getMineById(req: Request, res: Response) {
    const order = await orderService.getMineById(req.user!.id, req.params.orderId!);
    res.status(200).json({ order });
  },
};
