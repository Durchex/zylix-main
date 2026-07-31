import { Router } from "express";
import { shippingController } from "@/controllers/shipping.controller";
import { asyncHandler } from "@/middleware/asyncHandler";

export const shippingRouter = Router();

shippingRouter.get("/quote", asyncHandler(shippingController.getQuote));
