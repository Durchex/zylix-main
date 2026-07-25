import type { Request, Response } from "express";
import { addressService } from "@/services/address.service";
import { addressInputSchema, updateAddressSchema } from "@/validation/address.schema";

export const addressController = {
  async list(req: Request, res: Response) {
    const addresses = await addressService.list(req.user!.id);
    res.status(200).json({ addresses });
  },

  async create(req: Request, res: Response) {
    const input = addressInputSchema.parse(req.body);
    const address = await addressService.create(req.user!.id, input);
    res.status(201).json({ address });
  },

  async update(req: Request, res: Response) {
    const input = updateAddressSchema.parse(req.body);
    const address = await addressService.update(req.user!.id, req.params.addressId!, input);
    res.status(200).json({ address });
  },

  async remove(req: Request, res: Response) {
    await addressService.remove(req.user!.id, req.params.addressId!);
    res.status(204).send();
  },
};
