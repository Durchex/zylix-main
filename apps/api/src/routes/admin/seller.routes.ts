import { Router } from "express";
import { adminSellerController } from "@/controllers/admin/seller.controller";
import { asyncHandler } from "@/middleware/asyncHandler";

export const adminSellerRouter = Router();

adminSellerRouter.get("/", asyncHandler(adminSellerController.list));
adminSellerRouter.get("/:id", asyncHandler(adminSellerController.getById));
adminSellerRouter.patch("/:id/approve", asyncHandler(adminSellerController.approve));
adminSellerRouter.patch("/:id/reject", asyncHandler(adminSellerController.reject));
