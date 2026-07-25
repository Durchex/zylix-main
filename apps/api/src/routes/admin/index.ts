import { Router } from "express";
import { requireAuth, requireRole } from "@/middleware/auth";
import { asyncHandler } from "@/middleware/asyncHandler";
import { adminProductRouter } from "@/routes/admin/product.routes";
import { adminCategoryRouter } from "@/routes/admin/category.routes";
import { adminOrderRouter } from "@/routes/admin/order.routes";
import { adminSellerRouter } from "@/routes/admin/seller.routes";
import { adminUserRouter } from "@/routes/admin/user.routes";
import { adminBlogRouter } from "@/routes/admin/blog.routes";
import { adminUploadRouter } from "@/routes/admin/upload.routes";
import { adminDashboardController } from "@/controllers/admin/dashboard.controller";
import { auditLogController } from "@/controllers/admin/auditLog.controller";

export const adminRouter = Router();

// Every /admin/* route requires an authenticated ADMIN. Finer-grained
// adminPermissions checks (per PRD §5) can be layered in per-route as
// specific admin sub-roles (Support/Catalog Manager/Super Admin) are needed.
adminRouter.use(requireAuth, requireRole("ADMIN"));

adminRouter.get("/dashboard/stats", asyncHandler(adminDashboardController.getStats));
adminRouter.get("/audit-log", asyncHandler(auditLogController.list));
adminRouter.use("/products", adminProductRouter);
adminRouter.use("/categories", adminCategoryRouter);
adminRouter.use("/orders", adminOrderRouter);
adminRouter.use("/sellers", adminSellerRouter);
adminRouter.use("/users", adminUserRouter);
adminRouter.use("/blog", adminBlogRouter);
adminRouter.use("/uploads", adminUploadRouter);
