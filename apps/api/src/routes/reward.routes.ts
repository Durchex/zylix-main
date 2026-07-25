import { Router } from "express";
import { rewardController } from "@/controllers/reward.controller";
import { asyncHandler } from "@/middleware/asyncHandler";
import { requireAuth } from "@/middleware/auth";

export const rewardRouter = Router();

rewardRouter.get("/", requireAuth, asyncHandler(rewardController.getMine));
