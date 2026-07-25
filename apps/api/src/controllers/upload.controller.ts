import type { Request, Response } from "express";
import { ApiError } from "@/middleware/errorHandler";
import { uploadService } from "@/services/upload.service";

export const uploadController = {
  async uploadImage(req: Request, res: Response) {
    if (!req.file) {
      throw new ApiError(400, "No image file was provided");
    }

    const result = await uploadService.uploadImage(req.file.buffer);
    res.status(201).json(result);
  },
};
