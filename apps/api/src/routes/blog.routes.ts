import { Router } from "express";
import { blogController } from "@/controllers/blog.controller";
import { asyncHandler } from "@/middleware/asyncHandler";

export const blogRouter = Router();

blogRouter.get("/", asyncHandler(blogController.list));
blogRouter.get("/:slug", asyncHandler(blogController.getBySlug));
