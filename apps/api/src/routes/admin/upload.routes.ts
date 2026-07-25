import { Router } from "express";
import multer from "multer";
import { uploadController } from "@/controllers/upload.controller";
import { asyncHandler } from "@/middleware/asyncHandler";
import { ApiError } from "@/middleware/errorHandler";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new ApiError(400, "Only image files are allowed"));
      return;
    }
    cb(null, true);
  },
});

export const adminUploadRouter = Router();

adminUploadRouter.post("/", upload.single("file"), asyncHandler(uploadController.uploadImage));
