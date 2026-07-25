import { Router } from "express";
import { adminCategoryController } from "@/controllers/admin/category.controller";
import { asyncHandler } from "@/middleware/asyncHandler";

export const adminCategoryRouter = Router();

adminCategoryRouter.get("/", asyncHandler(adminCategoryController.list));
adminCategoryRouter.post("/", asyncHandler(adminCategoryController.create));
adminCategoryRouter.patch("/:id", asyncHandler(adminCategoryController.update));
adminCategoryRouter.delete("/:id", asyncHandler(adminCategoryController.remove));
