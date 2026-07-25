import { Router } from "express";
import { sellerController } from "@/controllers/seller.controller";
import { asyncHandler } from "@/middleware/asyncHandler";

export const sellerRouter = Router();

sellerRouter.get("/", asyncHandler(sellerController.list));
sellerRouter.get("/:slug", asyncHandler(sellerController.getBySlug));
