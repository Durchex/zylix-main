import type { Request, Response } from "express";
import { adminSellerService } from "@/services/admin/seller.service";
import { adminSellerListQuerySchema, rejectSellerSchema } from "@/validation/admin/seller.schema";

export const adminSellerController = {
  async list(req: Request, res: Response) {
    const query = adminSellerListQuerySchema.parse(req.query);
    const result = await adminSellerService.list(query);
    res.status(200).json(result);
  },

  async getById(req: Request, res: Response) {
    const seller = await adminSellerService.getById(req.params.id!);
    res.status(200).json({ seller });
  },

  async approve(req: Request, res: Response) {
    const seller = await adminSellerService.approve(req.params.id!, req.user!.id);
    res.status(200).json({ seller });
  },

  async reject(req: Request, res: Response) {
    const input = rejectSellerSchema.parse(req.body);
    const seller = await adminSellerService.reject(req.params.id!, req.user!.id, input.reason);
    res.status(200).json({ seller });
  },
};
