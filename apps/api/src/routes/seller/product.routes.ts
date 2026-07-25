import { Router } from "express";
import { sellerProductController } from "@/controllers/seller/product.controller";
import { asyncHandler } from "@/middleware/asyncHandler";

export const sellerProductRouter = Router();

sellerProductRouter.get("/", asyncHandler(sellerProductController.list));
sellerProductRouter.post("/", asyncHandler(sellerProductController.create));
sellerProductRouter.get("/:id", asyncHandler(sellerProductController.getById));
sellerProductRouter.patch("/:id", asyncHandler(sellerProductController.update));
sellerProductRouter.delete("/:id", asyncHandler(sellerProductController.remove));
