import type { Request, Response } from "express";
import { adminProductService } from "@/services/admin/product.service";
import {
  adminProductListQuerySchema,
  bulkCreateProductSchema,
  createProductSchema,
  updateProductSchema,
} from "@/validation/admin/product.schema";

export const adminProductController = {
  async list(req: Request, res: Response) {
    const query = adminProductListQuerySchema.parse(req.query);
    const result = await adminProductService.list(query);
    res.status(200).json(result);
  },

  async getById(req: Request, res: Response) {
    const product = await adminProductService.getById(req.params.id!);
    res.status(200).json({ product });
  },

  async create(req: Request, res: Response) {
    const input = createProductSchema.parse(req.body);
    const product = await adminProductService.create(input);
    res.status(201).json({ product });
  },

  async bulkCreate(req: Request, res: Response) {
    const input = bulkCreateProductSchema.parse(req.body);
    const result = await adminProductService.bulkCreate(input.products);
    res.status(207).json(result);
  },

  async update(req: Request, res: Response) {
    const input = updateProductSchema.parse(req.body);
    const product = await adminProductService.update(req.params.id!, input);
    res.status(200).json({ product });
  },

  async remove(req: Request, res: Response) {
    await adminProductService.delete(req.params.id!);
    res.status(204).send();
  },
};
