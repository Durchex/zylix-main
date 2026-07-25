import { Router } from "express";
import { supportController } from "@/controllers/support.controller";
import { asyncHandler } from "@/middleware/asyncHandler";
import { publicFormRateLimiter } from "@/middleware/rateLimiters";

export const supportRouter = Router();

supportRouter.post("/contact", publicFormRateLimiter, asyncHandler(supportController.submitContact));
