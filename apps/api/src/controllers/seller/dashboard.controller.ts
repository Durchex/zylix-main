import type { Request, Response } from "express";
import { sellerDashboardService } from "@/services/seller/dashboard.service";

export const sellerDashboardController = {
  async getStats(req: Request, res: Response) {
    const stats = await sellerDashboardService.getStats(req.seller!.id);
    res.status(200).json(stats);
  },
};
