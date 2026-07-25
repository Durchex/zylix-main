import type { Request, Response } from "express";
import { adminCategoryService } from "@/services/admin/category.service";
import { createCategorySchema, updateCategorySchema } from "@/validation/admin/category.schema";

export const adminCategoryController = {
  async list(_req: Request, res: Response) {
    const categories = await adminCategoryService.list();
    res.status(200).json({ categories });
  },

  async create(req: Request, res: Response) {
    const input = createCategorySchema.parse(req.body);
    const category = await adminCategoryService.create(input);
    res.status(201).json({ category });
  },

  async update(req: Request, res: Response) {
    const input = updateCategorySchema.parse(req.body);
    const category = await adminCategoryService.update(req.params.id!, input);
    res.status(200).json({ category });
  },

  async remove(req: Request, res: Response) {
    await adminCategoryService.delete(req.params.id!);
    res.status(204).send();
  },
};
