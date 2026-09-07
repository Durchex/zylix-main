import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { getEnv } from "@/server/config/env";
import { ApiError } from "@/server/http/errors";

let configured = false;

/**
 * Configured lazily rather than at import: the Express service configured
 * the SDK once at boot, but a Next.js build imports this module without
 * Cloudinary credentials present, and the SDK's global config would then be
 * poisoned for the lifetime of the lambda.
 */
function ensureConfigured(): boolean {
  const env = getEnv();
  const hasCredentials = Boolean(
    env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET,
  );
  if (!hasCredentials) return false;

  if (!configured) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });
    configured = true;
  }
  return true;
}

export function isCloudinaryConfigured(): boolean {
  return ensureConfigured();
}

/**
 * Uploads one image buffer and returns its delivered URL.
 *
 * `multer` handled the multipart parsing in Express; route handlers use the
 * Web `FormData` API instead (see the upload routes), so this takes the
 * already-extracted bytes and stays transport-agnostic.
 */
export async function uploadImage(buffer: Buffer, folder = "zylix/products"): Promise<{ url: string }> {
  if (!ensureConfigured()) {
    throw new ApiError(503, "Image uploads are not configured on this environment yet");
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
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
}

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/**
 * Pulls a single image out of a multipart request and validates it, applying
 * the same 5MB ceiling and image-only rule multer enforced.
 */
export async function readImageUpload(request: Request, field = "file"): Promise<Buffer> {
  const formData = await request.formData().catch(() => {
    throw new ApiError(400, "Expected a multipart form upload");
  });

  const file = formData.get(field);
  if (!file || typeof file === "string") {
    throw new ApiError(400, "No image file was provided");
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new ApiError(400, "Only JPEG, PNG, WebP, and AVIF images are allowed");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ApiError(400, "Image must be smaller than 5MB");
  }

  return Buffer.from(await file.arrayBuffer());
}
