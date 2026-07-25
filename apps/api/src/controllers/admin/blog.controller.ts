import type { Request, Response } from "express";
import { adminBlogService } from "@/services/admin/blog.service";
import {
  adminBlogListQuerySchema,
  createBlogPostSchema,
  updateBlogPostSchema,
} from "@/validation/admin/blog.schema";

export const adminBlogController = {
  async list(req: Request, res: Response) {
    const query = adminBlogListQuerySchema.parse(req.query);
    const result = await adminBlogService.list(query);
    res.status(200).json(result);
  },

  async getById(req: Request, res: Response) {
    const post = await adminBlogService.getById(req.params.id!);
    res.status(200).json({ post });
  },

  async create(req: Request, res: Response) {
    const input = createBlogPostSchema.parse(req.body);
    const post = await adminBlogService.create(req.user!.id, input);
    res.status(201).json({ post });
  },

  async update(req: Request, res: Response) {
    const input = updateBlogPostSchema.parse(req.body);
    const post = await adminBlogService.update(req.params.id!, input);
    res.status(200).json({ post });
  },

  async remove(req: Request, res: Response) {
    await adminBlogService.delete(req.params.id!);
    res.status(204).send();
  },
};
