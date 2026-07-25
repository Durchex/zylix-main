import { prisma } from "@/lib/prisma";
import { ApiError } from "@/middleware/errorHandler";

function toSummary(category: {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  parentId: string | null;
}) {
  return category;
}

export const categoryService = {
  async list() {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, slug: true, name: true, imageUrl: true, parentId: true },
    });
    return categories.map(toSummary);
  },

  async getBySlug(slug: string) {
    const category = await prisma.category.findFirst({
      where: { slug, isActive: true },
      select: { id: true, slug: true, name: true, imageUrl: true, parentId: true },
    });
    if (!category) {
      throw new ApiError(404, "Category not found");
    }
    return toSummary(category);
  },
};
