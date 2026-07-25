import request from "supertest";

jest.mock("@/lib/cloudinary", () => ({
  cloudinary: {
    uploader: {
      upload_stream: jest.fn((_opts, callback) => {
        callback(null, { secure_url: "https://res.cloudinary.com/zylix/image/upload/v1/products/test.jpg" });
        return { end: jest.fn() };
      }),
    },
  },
  isCloudinaryConfigured: true,
}));

import { createApp } from "@/app";
import { signAccessToken } from "@/utils/jwt";

const app = createApp();

function adminToken() {
  return signAccessToken({ sub: "admin_1", email: "admin@example.com", role: "ADMIN" });
}

describe("POST /admin/uploads", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await request(app)
      .post("/api/v1/admin/uploads")
      .attach("file", Buffer.from("fake-image"), "photo.jpg");
    expect(res.status).toBe(401);
  });

  it("rejects when no file is attached", async () => {
    const res = await request(app)
      .post("/api/v1/admin/uploads")
      .set("Authorization", `Bearer ${adminToken()}`);
    expect(res.status).toBe(400);
  });

  it("rejects a non-image file", async () => {
    const res = await request(app)
      .post("/api/v1/admin/uploads")
      .set("Authorization", `Bearer ${adminToken()}`)
      .attach("file", Buffer.from("not an image"), { filename: "notes.txt", contentType: "text/plain" });
    expect(res.status).toBe(400);
  });

  it("uploads a valid image and returns its URL", async () => {
    const res = await request(app)
      .post("/api/v1/admin/uploads")
      .set("Authorization", `Bearer ${adminToken()}`)
      .attach("file", Buffer.from("fake-image-bytes"), { filename: "photo.jpg", contentType: "image/jpeg" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ url: "https://res.cloudinary.com/zylix/image/upload/v1/products/test.jpg" });
  });
});
