import request from "supertest";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    seller: { findUnique: jest.fn(), create: jest.fn() },
    user: { update: jest.fn() },
    product: { findMany: jest.fn(), count: jest.fn() },
    $transaction: jest.fn((ops: unknown[]) =>
      Array.isArray(ops) ? Promise.all(ops) : ops,
    ),
    $queryRaw: jest.fn(),
  },
}));

jest.mock("@/lib/redis", () => ({
  redis: { ping: jest.fn().mockResolvedValue("PONG"), disconnect: jest.fn() },
}));

import { prisma } from "@/lib/prisma";
import { createApp } from "@/app";
import { signAccessToken } from "@/utils/jwt";

const mockPrisma = prisma as unknown as {
  seller: { findUnique: jest.Mock };
};

const app = createApp();

describe("/api/v1/seller RBAC", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await request(app).get("/api/v1/seller/dashboard/stats");
    expect(res.status).toBe(401);
  });

  it("returns 404 for an authenticated user with no seller profile", async () => {
    mockPrisma.seller.findUnique.mockResolvedValueOnce(null);
    const token = signAccessToken({ sub: "user_1", email: "customer@example.com", role: "CUSTOMER" });

    const res = await request(app)
      .get("/api/v1/seller/dashboard/stats")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("allows onboarding for an authenticated CUSTOMER with no seller profile yet", async () => {
    mockPrisma.seller.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    const token = signAccessToken({ sub: "user_1", email: "customer@example.com", role: "CUSTOMER" });

    const res = await request(app)
      .post("/api/v1/seller/onboarding")
      .set("Authorization", `Bearer ${token}`)
      .send({ storeName: "Test Store", storeSlug: "test-store" });

    // Reaches the handler rather than being blocked by requireSeller
    // (which onboarding must run before, per routes/seller/index.ts).
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(404);
  });

  it("passes through once a seller profile exists", async () => {
    mockPrisma.seller.findUnique.mockResolvedValueOnce({ id: "seller_1", status: "APPROVED" });
    const token = signAccessToken({ sub: "user_1", email: "seller@example.com", role: "SELLER" });

    const res = await request(app)
      .get("/api/v1/seller/products")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(404);
  });
});
