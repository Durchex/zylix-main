import { prisma } from "@/lib/prisma";
import { ApiError } from "@/middleware/errorHandler";
import type { CreateCategoryInput, UpdateCategoryInput } from "@/validation/admin/category.schema";

export const adminCategoryService = {
  async list() {
    return prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: true } } },
    });
  },

  async create(input: CreateCategoryInput) {
    const existing = await prisma.category.findUnique({ where: { slug: input.slug } });
    if (existing) {
      throw new ApiError(409, "A category with this slug already exists");
    }
    return prisma.category.create({ data: input });
  },

  async update(id: string, input: UpdateCategoryInput) {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, "Category not found");
    }
    if (input.slug && input.slug !== existing.slug) {
      const slugTaken = await prisma.category.findUnique({ where: { slug: input.slug } });
      if (slugTaken) throw new ApiError(409, "A category with this slug already exists");
    }
    if (input.parentId === id) {
      throw new ApiError(400, "A category cannot be its own parent");
    }
    return prisma.category.update({ where: { id }, data: input });
  },

  async delete(id: string) {
    const existing = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true, children: true } } },
    });
    if (!existing) {
      throw new ApiError(404, "Category not found");
    }
    if (existing._count.products > 0) {
      throw new ApiError(400, "Cannot delete a category that still has products assigned");
    }
    if (existing._count.children > 0) {
      throw new ApiError(400, "Cannot delete a category that has subcategories");
    }
    await prisma.category.delete({ where: { id } });
  },
};
