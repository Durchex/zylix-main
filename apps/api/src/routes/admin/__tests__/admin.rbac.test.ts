import request from "supertest";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    product: { findMany: jest.fn(), count: jest.fn() },
    order: { count: jest.fn(), aggregate: jest.fn(), findMany: jest.fn() },
    user: { count: jest.fn() },
    seller: { count: jest.fn() },
    productVariant: { count: jest.fn() },
    $queryRaw: jest.fn(),
  },
}));

jest.mock("@/lib/redis", () => ({
  redis: { ping: jest.fn().mockResolvedValue("PONG"), disconnect: jest.fn() },
}));

import { createApp } from "@/app";
import { signAccessToken } from "@/utils/jwt";

const app = createApp();

describe("Admin route RBAC", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await request(app).get("/api/v1/admin/dashboard/stats");
    expect(res.status).toBe(401);
  });

  it("rejects a valid token belonging to a non-admin CUSTOMER", async () => {
    const token = signAccessToken({ sub: "user_1", email: "customer@example.com", role: "CUSTOMER" });

    const res = await request(app)
      .get("/api/v1/admin/dashboard/stats")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("rejects a valid token belonging to a SELLER", async () => {
    const token = signAccessToken({ sub: "user_1", email: "seller@example.com", role: "SELLER" });

    const res = await request(app)
      .get("/api/v1/admin/products")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("allows a valid ADMIN token through to the handler", async () => {
    const token = signAccessToken({ sub: "admin_1", email: "admin@example.com", role: "ADMIN" });

    const res = await request(app)
      .get("/api/v1/admin/dashboard/stats")
      .set("Authorization", `Bearer ${token}`);

    // Reaches the handler (not blocked by auth/role) — the mocked Prisma
    // calls resolve to undefined, which is fine; we're only asserting RBAC.
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });
});
