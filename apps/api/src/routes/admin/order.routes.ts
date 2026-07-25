import { Router } from "express";
import { adminOrderController } from "@/controllers/admin/order.controller";
import { asyncHandler } from "@/middleware/asyncHandler";

export const adminOrderRouter = Router();

adminOrderRouter.get("/", asyncHandler(adminOrderController.list));
adminOrderRouter.get("/:id", asyncHandler(adminOrderController.getById));
adminOrderRouter.patch("/:id/status", asyncHandler(adminOrderController.updateStatus));
