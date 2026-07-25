import request from "supertest";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    order: { findUnique: jest.fn() },
    $queryRaw: jest.fn(),
  },
}));

jest.mock("@/lib/redis", () => ({
  redis: { ping: jest.fn().mockResolvedValue("PONG"), disconnect: jest.fn() },
}));

import { prisma } from "@/lib/prisma";
import { createApp } from "@/app";

const mockPrisma = prisma as unknown as {
  order: { findUnique: jest.Mock };
};

const app = createApp();

describe("POST /api/v1/orders", () => {
  it("requires authentication", async () => {
    const res = await request(app)
      .post("/api/v1/orders")
      .send({ items: [], shippingAddress: {}, paymentProvider: "FLUTTERWAVE" });

    expect(res.status).toBe(401);
  });
});

describe("GET /api/v1/orders/track", () => {
  it("returns 422 when required query params are missing", async () => {
    const res = await request(app).get("/api/v1/orders/track");
    expect(res.status).toBe(422);
  });

  it("returns 404 when no order matches", async () => {
    mockPrisma.order.findUnique.mockResolvedValueOnce(null);

    const res = await request(app).get(
      "/api/v1/orders/track?orderNumber=ZLX-NOPE&email=nobody@example.com",
    );

    expect(res.status).toBe(404);
  });
});

describe("GET /api/v1/orders/:orderId", () => {
  it("is publicly accessible (relies on the order id as the secret)", async () => {
    mockPrisma.order.findUnique.mockResolvedValueOnce({
      orderNumber: "ZLX-ABCD1234",
      total: { toString: () => "50000" },
      currency: "NGN",
    });

    const res = await request(app).get("/api/v1/orders/order_1");

    expect(res.status).toBe(200);
    expect(res.body.order).toEqual({ orderNumber: "ZLX-ABCD1234", total: "50000", currency: "NGN" });
  });
});
