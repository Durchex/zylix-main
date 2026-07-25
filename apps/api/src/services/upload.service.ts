import { cloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";
import { ApiError } from "@/middleware/errorHandler";

export const uploadService = {
  async uploadImage(buffer: Buffer): Promise<{ url: string }> {
    if (!isCloudinaryConfigured) {
      throw new ApiError(503, "Image uploads are not configured on this environment yet");
    }

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "zylix/products", resource_type: "image" },
        (err, result) => {
          if (err || !result) {
            reject(err instanceof Error ? err : new Error("Image upload failed"));
            return;
          }
          resolve({ url: result.secure_url });
        },
      );
      stream.end(buffer);
    });
  },
};
