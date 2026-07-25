import request from "supertest";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    address: { findMany: jest.fn(), findUnique: jest.fn() },
    order: { findMany: jest.fn(), count: jest.fn(), findFirst: jest.fn() },
    wallet: { findUnique: jest.fn() },
    rewardPointsLedger: { findMany: jest.fn(), count: jest.fn(), groupBy: jest.fn() },
  },
}));

jest.mock("@/lib/redis", () => ({
  redis: { ping: jest.fn().mockResolvedValue("PONG"), disconnect: jest.fn() },
}));

import { prisma } from "@/lib/prisma";
import { createApp } from "@/app";
import { signAccessToken } from "@/utils/jwt";

const mockPrisma = prisma as unknown as {
  address: { findMany: jest.Mock; findUnique: jest.Mock };
  order: { findMany: jest.Mock; count: jest.Mock; findFirst: jest.Mock };
  wallet: { findUnique: jest.Mock };
};

const app = createApp();

const PROTECTED_GET_ROUTES = ["/api/v1/addresses", "/api/v1/orders/mine", "/api/v1/wallet", "/api/v1/rewards"];

describe("Account-scoped routes require authentication", () => {
  it.each(PROTECTED_GET_ROUTES)("rejects unauthenticated requests to %s", async (route) => {
    const res = await request(app).get(route);
    expect(res.status).toBe(401);
  });
});

describe("Account-scoped routes are isolated per user", () => {
  const token = signAccessToken({ sub: "user_1", email: "customer@example.com", role: "CUSTOMER" });

  it("does not expose another user's address by guessing its id", async () => {
    mockPrisma.address.findUnique.mockResolvedValueOnce({ id: "addr_1", userId: "someone_else" });

    const res = await request(app)
      .patch("/api/v1/addresses/addr_1")
      .set("Authorization", `Bearer ${token}`)
      .send({ fullName: "Hijacked" });

    expect(res.status).toBe(404);
  });

  it("does not expose another user's order by guessing its id", async () => {
    mockPrisma.order.findFirst.mockResolvedValueOnce(null);

    const res = await request(app)
      .get("/api/v1/orders/mine/order_belongs_to_someone_else")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(mockPrisma.order.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: "user_1" }) }),
    );
  });

  it("lists only the calling user's own addresses", async () => {
    mockPrisma.address.findMany.mockResolvedValueOnce([]);

    const res = await request(app).get("/api/v1/addresses").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(mockPrisma.address.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user_1" } }),
    );
  });

  it("404s when the calling user has no wallet yet", async () => {
    mockPrisma.wallet.findUnique.mockResolvedValueOnce(null);

    const res = await request(app).get("/api/v1/wallet").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
