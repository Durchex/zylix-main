import { Router } from "express";
import { adminBlogController } from "@/controllers/admin/blog.controller";
import { asyncHandler } from "@/middleware/asyncHandler";

export const adminBlogRouter = Router();

adminBlogRouter.get("/", asyncHandler(adminBlogController.list));
adminBlogRouter.post("/", asyncHandler(adminBlogController.create));
adminBlogRouter.get("/:id", asyncHandler(adminBlogController.getById));
adminBlogRouter.patch("/:id", asyncHandler(adminBlogController.update));
adminBlogRouter.delete("/:id", asyncHandler(adminBlogController.remove));
