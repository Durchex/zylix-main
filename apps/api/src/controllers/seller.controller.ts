import type { Request, Response } from "express";
import { sellerService } from "@/services/seller.service";

export const sellerController = {
  async list(_req: Request, res: Response) {
    const sellers = await sellerService.list();
    res.status(200).json({ sellers });
  },

  async getBySlug(req: Request, res: Response) {
    const seller = await sellerService.getBySlug(req.params.slug!);
    res.status(200).json({ seller });
  },
};
