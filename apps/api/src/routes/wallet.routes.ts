import { Router } from "express";
import { walletController } from "@/controllers/wallet.controller";
import { asyncHandler } from "@/middleware/asyncHandler";
import { requireAuth } from "@/middleware/auth";

export const walletRouter = Router();

walletRouter.get("/", requireAuth, asyncHandler(walletController.getMine));
