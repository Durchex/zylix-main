import type { Request, Response } from "express";
import { adminShippingService } from "@/services/admin/shipping.service";
import { createShippingZoneSchema, updateShippingZoneSchema } from "@/validation/admin/shipping.schema";

export const adminShippingController = {
  async list(_req: Request, res: Response) {
    const zones = await adminShippingService.list();
    res.status(200).json({ zones });
  },

  async create(req: Request, res: Response) {
    const input = createShippingZoneSchema.parse(req.body);
    const zone = await adminShippingService.create(input);
    res.status(201).json({ zone });
  },

  async update(req: Request, res: Response) {
    const input = updateShippingZoneSchema.parse(req.body);
    const zone = await adminShippingService.update(req.params.id!, input);
    res.status(200).json({ zone });
  },

  async remove(req: Request, res: Response) {
    await adminShippingService.delete(req.params.id!);
    res.status(204).send();
  },
};
