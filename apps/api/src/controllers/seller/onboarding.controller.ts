import type { Request, Response } from "express";
import { sellerOnboardingService } from "@/services/seller/onboarding.service";
import { sellerOnboardingSchema } from "@/validation/seller/onboarding.schema";

export const sellerOnboardingController = {
  async apply(req: Request, res: Response) {
    const input = sellerOnboardingSchema.parse(req.body);
    const seller = await sellerOnboardingService.apply(req.user!.id, input);
    res.status(201).json({ seller });
  },

  async getMyProfile(req: Request, res: Response) {
    const seller = await sellerOnboardingService.getMyProfile(req.user!.id);
    res.status(200).json({ seller });
  },
};
