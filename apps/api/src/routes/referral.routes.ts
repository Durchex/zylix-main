import { Router } from "express";
import { referralController } from "@/controllers/referral.controller";
import { asyncHandler } from "@/middleware/asyncHandler";
import { requireAuth } from "@/middleware/auth";

export const referralRouter = Router();

referralRouter.get("/me", requireAuth, asyncHandler(referralController.me));
