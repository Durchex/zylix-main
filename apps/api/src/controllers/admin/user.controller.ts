import type { Request, Response } from "express";
import { adminUserService } from "@/services/admin/user.service";
import { adminUserListQuerySchema, updateUserStatusSchema } from "@/validation/admin/user.schema";

export const adminUserController = {
  async list(req: Request, res: Response) {
    const query = adminUserListQuerySchema.parse(req.query);
    const result = await adminUserService.list(query);
    res.status(200).json(result);
  },

  async getById(req: Request, res: Response) {
    const user = await adminUserService.getById(req.params.id!);
    res.status(200).json({ user });
  },

  async updateStatus(req: Request, res: Response) {
    const input = updateUserStatusSchema.parse(req.body);
    const user = await adminUserService.updateStatus(req.params.id!, input, req.user!.id);
    res.status(200).json({ user });
  },
};
