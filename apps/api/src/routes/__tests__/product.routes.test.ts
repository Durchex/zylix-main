import request from "supertest";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    product: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}));

jest.mock("@/lib/redis", () => ({
  redis: { ping: jest.fn().mockResolvedValue("PONG"), disconnect: jest.fn() },
}));

import { prisma } from "@/lib/prisma";
import { createApp } from "@/app";

const mockPrisma = prisma as unknown as {
  product: { findMany: jest.Mock; count: jest.Mock; findFirst: jest.Mock };
};

const app = createApp();

describe("GET /api/v1/products", () => {
  it("returns a paginated list", async () => {
    mockPrisma.product.findMany.mockResolvedValueOnce([]);
    mockPrisma.product.count.mockResolvedValueOnce(0);

    const res = await request(app).get("/api/v1/products");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ items: [], total: 0, page: 1, pageSize: 20 });
  });

  it("returns 422 for an invalid sort value", async () => {
    const res = await request(app).get("/api/v1/products?sort=not-a-real-sort");
    expect(res.status).toBe(422);
  });
});

describe("GET /api/v1/products/by-id/:id vs /:slug route ordering", () => {
  it("routes /by-id/:id to the by-id handler, not the slug handler", async () => {
    mockPrisma.product.findFirst.mockResolvedValueOnce(null);

    const res = await request(app).get("/api/v1/products/by-id/some-product-id");

    expect(res.status).toBe(404);
    // The by-id handler queries by `id`, not `slug` — confirms it was reached
    // rather than the slug route treating "by-id" as a literal slug segment.
    expect(mockPrisma.product.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: "some-product-id" }) }),
    );
  });

  it("returns 404 for an unknown slug", async () => {
    mockPrisma.product.findFirst.mockResolvedValueOnce(null);

    const res = await request(app).get("/api/v1/products/not-a-real-slug");

    expect(res.status).toBe(404);
  });
});
