import { ApiError } from "@/middleware/errorHandler";

describe("uploadService.uploadImage", () => {
  afterEach(() => {
    jest.resetModules();
  });

  it("rejects with 503 when Cloudinary isn't configured", async () => {
    jest.doMock("@/lib/cloudinary", () => ({
      cloudinary: { uploader: { upload_stream: jest.fn() } },
      isCloudinaryConfigured: false,
    }));
    const { uploadService } = await import("@/services/upload.service");

    await expect(uploadService.uploadImage(Buffer.from("x"))).rejects.toThrow(ApiError);
  });

  it("resolves with the secure URL on a successful upload", async () => {
    const uploadStream = jest.fn((_opts, callback) => {
      callback(null, { secure_url: "https://res.cloudinary.com/zylix/image/upload/v1/products/abc.jpg" });
      return { end: jest.fn() };
    });
    jest.doMock("@/lib/cloudinary", () => ({
      cloudinary: { uploader: { upload_stream: uploadStream } },
      isCloudinaryConfigured: true,
    }));
    const { uploadService } = await import("@/services/upload.service");

    const result = await uploadService.uploadImage(Buffer.from("fake-image-bytes"));

    expect(result).toEqual({ url: "https://res.cloudinary.com/zylix/image/upload/v1/products/abc.jpg" });
  });

  it("rejects when Cloudinary returns an error", async () => {
    const uploadStream = jest.fn((_opts, callback) => {
      callback(new Error("Cloudinary is down"), undefined);
      return { end: jest.fn() };
    });
    jest.doMock("@/lib/cloudinary", () => ({
      cloudinary: { uploader: { upload_stream: uploadStream } },
      isCloudinaryConfigured: true,
    }));
    const { uploadService } = await import("@/services/upload.service");

    await expect(uploadService.uploadImage(Buffer.from("x"))).rejects.toThrow("Cloudinary is down");
  });
});
