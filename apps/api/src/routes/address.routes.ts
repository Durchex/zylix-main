import { Router } from "express";
import { addressController } from "@/controllers/address.controller";
import { asyncHandler } from "@/middleware/asyncHandler";
import { requireAuth } from "@/middleware/auth";

export const addressRouter = Router();

addressRouter.use(requireAuth);
addressRouter.get("/", asyncHandler(addressController.list));
addressRouter.post("/", asyncHandler(addressController.create));
addressRouter.patch("/:addressId", asyncHandler(addressController.update));
addressRouter.delete("/:addressId", asyncHandler(addressController.remove));
