import { Router } from "express";
import { categoryController } from "@/controllers/category.controller";
import { asyncHandler } from "@/middleware/asyncHandler";

export const categoryRouter = Router();

categoryRouter.get("/", asyncHandler(categoryController.list));
categoryRouter.get("/:slug", asyncHandler(categoryController.getBySlug));
