import type { Request, Response } from "express";
import { referralService } from "@/services/referral.service";

export const referralController = {
  async me(req: Request, res: Response) {
    const summary = await referralService.getMyReferralSummary(req.user!.id);
    res.status(200).json(summary);
  },
};
