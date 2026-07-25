import type { Request, Response } from "express";
import { blogService } from "@/services/blog.service";
import { blogListQuerySchema } from "@/validation/blog.schema";

export const blogController = {
  async list(req: Request, res: Response) {
    const query = blogListQuerySchema.parse(req.query);
    const result = await blogService.list(query);
    res.status(200).json(result);
  },

  async getBySlug(req: Request, res: Response) {
    const post = await blogService.getBySlug(req.params.slug!);
    res.status(200).json({ post });
  },
};
