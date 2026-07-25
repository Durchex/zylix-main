import type { Request, Response } from "express";
import { adminDashboardService } from "@/services/admin/dashboard.service";

export const adminDashboardController = {
  async getStats(_req: Request, res: Response) {
    const stats = await adminDashboardService.getStats();
    res.status(200).json(stats);
  },
};
