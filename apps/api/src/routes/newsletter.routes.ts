import { Router } from "express";
import { newsletterController } from "@/controllers/newsletter.controller";
import { asyncHandler } from "@/middleware/asyncHandler";
import { publicFormRateLimiter } from "@/middleware/rateLimiters";

export const newsletterRouter = Router();

newsletterRouter.post("/subscribe", publicFormRateLimiter, asyncHandler(newsletterController.subscribe));
newsletterRouter.post("/unsubscribe", publicFormRateLimiter, asyncHandler(newsletterController.unsubscribe));
