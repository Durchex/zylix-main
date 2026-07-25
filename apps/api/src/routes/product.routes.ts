import { Router } from "express";
import { productController } from "@/controllers/product.controller";
import { asyncHandler } from "@/middleware/asyncHandler";

export const productRouter = Router();

productRouter.get("/", asyncHandler(productController.list));
productRouter.get("/by-id/:id", asyncHandler(productController.getById));
productRouter.get("/:slug", asyncHandler(productController.getBySlug));
