import type { Request, Response } from "express";
import { rewardService } from "@/services/reward.service";
import { rewardLedgerListQuerySchema } from "@/validation/reward.schema";

export const rewardController = {
  async getMine(req: Request, res: Response) {
    const query = rewardLedgerListQuerySchema.parse(req.query);
    const rewards = await rewardService.getMyRewards(req.user!.id, query);
    res.status(200).json(rewards);
  },
};
