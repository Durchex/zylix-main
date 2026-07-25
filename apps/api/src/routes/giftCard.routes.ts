import { Router } from "express";
import { giftCardController } from "@/controllers/giftCard.controller";
import { asyncHandler } from "@/middleware/asyncHandler";
import { attachUserIfPresent } from "@/middleware/auth";
import { publicFormRateLimiter } from "@/middleware/rateLimiters";

export const giftCardRouter = Router();

giftCardRouter.post(
  "/",
  publicFormRateLimiter,
  attachUserIfPresent,
  asyncHandler(giftCardController.purchase),
);
