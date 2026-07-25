import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { adminCategoryService } from "@/services/admin/category.service";
import { ApiError } from "@/middleware/errorHandler";

const mockPrisma = prisma as unknown as {
  category: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

describe("adminCategoryService.create", () => {
  it("rejects a duplicate slug", async () => {
    mockPrisma.category.findUnique.mockResolvedValueOnce({ id: "existing" });

    await expect(
      adminCategoryService.create({
        name: "Smartphones",
        slug: "smartphones",
        isActive: true,
        sortOrder: 0,
      }),
    ).rejects.toThrow(ApiError);
  });
});

describe("adminCategoryService.update", () => {
  it("rejects setting a category as its own parent", async () => {
    mockPrisma.category.findUnique.mockResolvedValueOnce({ id: "cat_1", slug: "smartphones" });

    await expect(adminCategoryService.update("cat_1", { parentId: "cat_1" })).rejects.toThrow(ApiError);
  });
});

describe("adminCategoryService.delete", () => {
  it("throws 404 for an unknown category", async () => {
    mockPrisma.category.findUnique.mockResolvedValueOnce(null);
    await expect(adminCategoryService.delete("does-not-exist")).rejects.toThrow(ApiError);
  });

  it("refuses to delete a category that still has products", async () => {
    mockPrisma.category.findUnique.mockResolvedValueOnce({
      id: "cat_1",
      _count: { products: 3, children: 0 },
    });

    await expect(adminCategoryService.delete("cat_1")).rejects.toThrow(ApiError);
  });

  it("refuses to delete a category that has subcategories", async () => {
    mockPrisma.category.findUnique.mockResolvedValueOnce({
      id: "cat_1",
      _count: { products: 0, children: 2 },
    });

    await expect(adminCategoryService.delete("cat_1")).rejects.toThrow(ApiError);
  });

  it("deletes a category with no products or children", async () => {
    mockPrisma.category.findUnique.mockResolvedValueOnce({
      id: "cat_1",
      _count: { products: 0, children: 0 },
    });
    mockPrisma.category.delete.mockResolvedValueOnce({});

    await adminCategoryService.delete("cat_1");

    expect(mockPrisma.category.delete).toHaveBeenCalledWith({ where: { id: "cat_1" } });
  });
});
