import type { Request, Response } from "express";
import { productService } from "@/services/product.service";
import { productListQuerySchema } from "@/validation/product.schema";

export const productController = {
  async list(req: Request, res: Response) {
    const query = productListQuerySchema.parse(req.query);
    const result = await productService.list(query);
    res.status(200).json(result);
  },

  async getBySlug(req: Request, res: Response) {
    const product = await productService.getBySlug(req.params.slug!);
    res.status(200).json({ product });
  },

  async getById(req: Request, res: Response) {
    const product = await productService.getById(req.params.id!);
    res.status(200).json({ product });
  },
};
