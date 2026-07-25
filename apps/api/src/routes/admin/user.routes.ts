import { Router } from "express";
import { adminUserController } from "@/controllers/admin/user.controller";
import { asyncHandler } from "@/middleware/asyncHandler";

export const adminUserRouter = Router();

adminUserRouter.get("/", asyncHandler(adminUserController.list));
adminUserRouter.get("/:id", asyncHandler(adminUserController.getById));
adminUserRouter.patch("/:id/status", asyncHandler(adminUserController.updateStatus));
