import { Router } from "express";
import { newsletterController } from "@/controllers/newsletter.controller";
import { asyncHandler } from "@/middleware/asyncHandler";

export const newsletterRouter = Router();

newsletterRouter.post("/unsubscribe", asyncHandler(newsletterController.unsubscribe));
