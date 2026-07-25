import { Router } from "express";
import { requireAuth, requireSeller } from "@/middleware/auth";
import { asyncHandler } from "@/middleware/asyncHandler";
import { sellerOnboardingController } from "@/controllers/seller/onboarding.controller";
import { sellerDashboardController } from "@/controllers/seller/dashboard.controller";
import { sellerProductRouter } from "@/routes/seller/product.routes";
import { sellerOrderRouter } from "@/routes/seller/order.routes";

export const sellerDashboardRouter = Router();

sellerDashboardRouter.use(requireAuth);

// Onboarding creates the Seller record — must run before requireSeller,
// which needs that record to already exist.
sellerDashboardRouter.post("/onboarding", asyncHandler(sellerOnboardingController.apply));

sellerDashboardRouter.use(requireSeller);

sellerDashboardRouter.get("/me", asyncHandler(sellerOnboardingController.getMyProfile));
sellerDashboardRouter.get("/dashboard/stats", asyncHandler(sellerDashboardController.getStats));
sellerDashboardRouter.use("/products", sellerProductRouter);
sellerDashboardRouter.use("/orders", sellerOrderRouter);
