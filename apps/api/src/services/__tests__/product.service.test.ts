import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    product: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

import { productService } from "@/services/product.service";
import { productListQuerySchema } from "@/validation/product.schema";
import { ApiError } from "@/middleware/errorHandler";

const mockPrisma = prisma as unknown as {
  product: { findMany: jest.Mock; count: jest.Mock; findFirst: jest.Mock };
};

function buildProduct(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "prod_1",
    slug: "iphone-16-pro",
    name: "iPhone 16 Pro",
    brand: "Apple",
    basePrice: 1250000,
    compareAtPrice: 1450000,
    currency: "NGN",
    avgRating: 4.5,
    reviewCount: 128,
    isFeatured: true,
    images: [{ id: "img_1", url: "https://example.com/a.jpg", altText: null, sortOrder: 0 }],
    category: { id: "cat_1", slug: "smartphones", name: "Smartphones" },
    stockQuantity: 10,
    variants: [],
    ...overrides,
  };
}

describe("productService.list", () => {
  it("only queries ACTIVE products by default", async () => {
    mockPrisma.product.findMany.mockResolvedValueOnce([]);
    mockPrisma.product.count.mockResolvedValueOnce(0);

    await productService.list(productListQuerySchema.parse({}));

    const where = mockPrisma.product.findMany.mock.calls[0][0].where;
    expect(where.status).toBe("ACTIVE");
  });

  it("filters by category slug", async () => {
    mockPrisma.product.findMany.mockResolvedValueOnce([]);
    mockPrisma.product.count.mockResolvedValueOnce(0);

    await productService.list(productListQuerySchema.parse({ category: "smartphones" }));

    const where = mockPrisma.product.findMany.mock.calls[0][0].where;
    expect(where.category).toEqual({ slug: "smartphones" });
  });

  it("builds a case-insensitive OR search across name/brand/description", async () => {
    mockPrisma.product.findMany.mockResolvedValueOnce([]);
    mockPrisma.product.count.mockResolvedValueOnce(0);

    await productService.list(productListQuerySchema.parse({ search: "phone" }));

    const where = mockPrisma.product.findMany.mock.calls[0][0].where;
    expect(where.OR).toHaveLength(3);
    expect(where.OR[0]).toEqual({ name: { contains: "phone", mode: "insensitive" } });
  });

  it("maps DB records to the frontend ProductSummary shape", async () => {
    mockPrisma.product.findMany.mockResolvedValueOnce([buildProduct()]);
    mockPrisma.product.count.mockResolvedValueOnce(1);

    const result = await productService.list(productListQuerySchema.parse({}));

    expect(result.items[0]).toMatchObject({
      id: "prod_1",
      slug: "iphone-16-pro",
      basePrice: "1250000",
      compareAtPrice: "1450000",
      primaryImage: { id: "img_1" },
      category: { slug: "smartphones" },
      stockQuantity: 10,
      defaultVariant: null,
    });
    expect(result.total).toBe(1);
  });

  it("includes the default variant's price/stock for products that have variants", async () => {
    mockPrisma.product.findMany.mockResolvedValueOnce([
      buildProduct({
        variants: [{ id: "var_1", price: 1300000, stockQuantity: 5, isDefault: true }],
      }),
    ]);
    mockPrisma.product.count.mockResolvedValueOnce(1);

    const result = await productService.list(productListQuerySchema.parse({}));

    expect(result.items[0]).toMatchObject({
      defaultVariant: { id: "var_1", price: "1300000", stockQuantity: 5 },
    });
  });

  it("orders by price ascending when sort=price-asc", async () => {
    mockPrisma.product.findMany.mockResolvedValueOnce([]);
    mockPrisma.product.count.mockResolvedValueOnce(0);

    await productService.list(productListQuerySchema.parse({ sort: "price-asc" }));

    const orderBy = mockPrisma.product.findMany.mock.calls[0][0].orderBy;
    expect(orderBy).toEqual({ basePrice: "asc" });
  });
});

describe("productService.getBySlug", () => {
  it("throws a 404 ApiError when no active product matches", async () => {
    mockPrisma.product.findFirst.mockResolvedValueOnce(null);

    await expect(productService.getBySlug("does-not-exist")).rejects.toThrow(ApiError);
  });

  it("returns full detail including images, variants, and attributes", async () => {
    mockPrisma.product.findFirst.mockResolvedValueOnce({
      ...buildProduct(),
      description: "The latest flagship.",
      sku: "IPH16PRO",
      seoTitle: null,
      seoDescription: null,
      images: [{ id: "img_1", url: "https://example.com/a.jpg", altText: null, sortOrder: 0 }],
      variants: [
        {
          id: "var_1",
          sku: "IPH16PRO-256",
          name: "256GB",
          price: 1250000,
          compareAtPrice: null,
          stockQuantity: 10,
          isDefault: true,
        },
      ],
      seller: { id: "seller_1", storeName: "Durchex D.A.M", storeSlug: "durchex" },
      attributeValues: [
        { attributeValue: { attribute: { name: "Storage" }, value: "256GB" } },
      ],
    });

    const result = await productService.getBySlug("iphone-16-pro");

    expect(result.variants[0]).toMatchObject({ id: "var_1", price: "1250000" });
    expect(result.attributes[0]).toEqual({ attributeName: "Storage", value: "256GB" });
    expect(result.seller.storeSlug).toBe("durchex");
  });
});
