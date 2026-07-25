import { Router } from "express";
import { sellerOrderController } from "@/controllers/seller/order.controller";
import { asyncHandler } from "@/middleware/asyncHandler";

export const sellerOrderRouter = Router();

sellerOrderRouter.get("/", asyncHandler(sellerOrderController.list));
sellerOrderRouter.get("/:orderId", asyncHandler(sellerOrderController.getById));
sellerOrderRouter.patch(
  "/:orderId/items/:itemId/fulfillment",
  asyncHandler(sellerOrderController.updateFulfillment),
);
