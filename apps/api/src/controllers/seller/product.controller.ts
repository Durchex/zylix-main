import type { Request, Response } from "express";
import { sellerProductService } from "@/services/seller/product.service";
import {
  createSellerProductSchema,
  sellerProductListQuerySchema,
  updateSellerProductSchema,
} from "@/validation/seller/product.schema";

export const sellerProductController = {
  async list(req: Request, res: Response) {
    const query = sellerProductListQuerySchema.parse(req.query);
    const result = await sellerProductService.list(req.seller!.id, query);
    res.status(200).json(result);
  },

  async getById(req: Request, res: Response) {
    const product = await sellerProductService.getById(req.seller!.id, req.params.id!);
    res.status(200).json({ product });
  },

  async create(req: Request, res: Response) {
    const input = createSellerProductSchema.parse(req.body);
    const product = await sellerProductService.create(req.seller!.id, input);
    res.status(201).json({ product });
  },

  async update(req: Request, res: Response) {
    const input = updateSellerProductSchema.parse(req.body);
    const product = await sellerProductService.update(req.seller!.id, req.params.id!, input);
    res.status(200).json({ product });
  },

  async remove(req: Request, res: Response) {
    await sellerProductService.delete(req.seller!.id, req.params.id!);
    res.status(204).send();
  },
};
