import { Router } from "express";
import { adminProductController } from "@/controllers/admin/product.controller";
import { asyncHandler } from "@/middleware/asyncHandler";

export const adminProductRouter = Router();

adminProductRouter.get("/", asyncHandler(adminProductController.list));
adminProductRouter.post("/", asyncHandler(adminProductController.create));
adminProductRouter.post("/bulk", asyncHandler(adminProductController.bulkCreate));
adminProductRouter.get("/:id", asyncHandler(adminProductController.getById));
adminProductRouter.patch("/:id", asyncHandler(adminProductController.update));
adminProductRouter.delete("/:id", asyncHandler(adminProductController.remove));
