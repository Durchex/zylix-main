import { Router } from "express";
import { webhookController } from "@/controllers/webhook.controller";
import { asyncHandler } from "@/middleware/asyncHandler";

export const webhookRouter = Router();

webhookRouter.post("/flutterwave", asyncHandler(webhookController.flutterwave));
webhookRouter.post("/paystack", asyncHandler(webhookController.paystack));
webhookRouter.post("/stripe", asyncHandler(webhookController.stripe));
