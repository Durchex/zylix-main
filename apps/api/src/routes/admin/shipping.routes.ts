import { Router } from "express";
import { adminShippingController } from "@/controllers/admin/shipping.controller";
import { asyncHandler } from "@/middleware/asyncHandler";

export const adminShippingRouter = Router();

adminShippingRouter.get("/", asyncHandler(adminShippingController.list));
adminShippingRouter.post("/", asyncHandler(adminShippingController.create));
adminShippingRouter.patch("/:id", asyncHandler(adminShippingController.update));
adminShippingRouter.delete("/:id", asyncHandler(adminShippingController.remove));
