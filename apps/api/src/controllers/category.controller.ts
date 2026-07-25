import type { Request, Response } from "express";
import { categoryService } from "@/services/category.service";

export const categoryController = {
  async list(_req: Request, res: Response) {
    const categories = await categoryService.list();
    res.status(200).json({ categories });
  },

  async getBySlug(req: Request, res: Response) {
    const category = await categoryService.getBySlug(req.params.slug!);
    res.status(200).json({ category });
  },
};
