import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    product: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(async (callback: (tx: unknown) => unknown) => callback(mockTx())),
  },
}));

function mockTx() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("@/lib/prisma").prisma;
}

import { sellerProductService } from "@/services/seller/product.service";
import { ApiError } from "@/middleware/errorHandler";

const mockPrisma = prisma as unknown as {
  product: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock; delete: jest.Mock };
  productImage: { deleteMany: jest.Mock };
  productVariant: { deleteMany: jest.Mock };
};

(mockPrisma as unknown as Record<string, unknown>).productImage = { deleteMany: jest.fn() };
(mockPrisma as unknown as Record<string, unknown>).productVariant = { deleteMany: jest.fn() };
(mockPrisma.product as unknown as Record<string, unknown>).update = jest.fn();
(mockPrisma.product as unknown as Record<string, unknown>).delete = jest.fn();

describe("sellerProductService ownership enforcement", () => {
  it("getById throws 404 for a product owned by a different seller", async () => {
    mockPrisma.product.findUnique.mockResolvedValueOnce({
      id: "prod_1",
      sellerId: "seller_OTHER",
    });

    await expect(sellerProductService.getById("seller_ME", "prod_1")).rejects.toThrow(ApiError);
  });

  it("getById throws 404 (not 403) so ownership isn't leaked", async () => {
    mockPrisma.product.findUnique.mockResolvedValueOnce({
      id: "prod_1",
      sellerId: "seller_OTHER",
    });

    try {
      await sellerProductService.getById("seller_ME", "prod_1");
      fail("expected to throw");
    } catch (err) {
      expect((err as ApiError).statusCode).toBe(404);
    }
  });

  it("update refuses to modify a product owned by a different seller", async () => {
    mockPrisma.product.findUnique.mockResolvedValueOnce({
      id: "prod_1",
      sellerId: "seller_OTHER",
      slug: "some-slug",
      sku: "SKU1",
    });

    await expect(
      sellerProductService.update("seller_ME", "prod_1", { name: "Hacked" }),
    ).rejects.toThrow(ApiError);
  });

  it("delete refuses to remove a product owned by a different seller", async () => {
    mockPrisma.product.findUnique.mockResolvedValueOnce({
      id: "prod_1",
      sellerId: "seller_OTHER",
    });

    await expect(sellerProductService.delete("seller_ME", "prod_1")).rejects.toThrow(ApiError);
    expect(mockPrisma.product.delete).not.toHaveBeenCalled();
  });

  it("allows the owning seller to update their own product", async () => {
    mockPrisma.product.findUnique.mockResolvedValueOnce({
      id: "prod_1",
      sellerId: "seller_ME",
      slug: "my-slug",
      sku: "MYSKU",
    });
    mockPrisma.product.update.mockResolvedValueOnce({ id: "prod_1" });

    await sellerProductService.update("seller_ME", "prod_1", { name: "Updated name" });

    expect(mockPrisma.product.update).toHaveBeenCalled();
  });
});

describe("sellerProductService.create", () => {
  it("always stamps the product with the calling seller's id, ignoring any client input", async () => {
    mockPrisma.product.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    mockPrisma.product.create.mockResolvedValueOnce({ id: "prod_1" });

    await sellerProductService.create("seller_ME", {
      categoryId: "cat_1",
      name: "Test",
      slug: "test",
      brand: "TestBrand",
      description: "desc",
      basePrice: 1000,
      currency: "NGN",
      sku: "SKU1",
      status: "DRAFT",
      images: [],
      variants: [],
    });

    const createCall = mockPrisma.product.create.mock.calls[0][0];
    expect(createCall.data.sellerId).toBe("seller_ME");
  });
});
