import "server-only";
import { ApiError } from "@/server/http/errors";
import { Category } from "@/server/models";

interface CategorySummary {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  parentId: string | null;
}

function toSummary(category: {
  _id: unknown;
  slug: string;
  name: string;
  imageUrl?: string | null;
  parentId?: unknown;
}): CategorySummary {
  return {
    id: String(category._id),
    slug: category.slug,
    name: category.name,
    imageUrl: category.imageUrl ?? null,
    parentId: category.parentId ? String(category.parentId) : null,
  };
}

export const categoryService = {
  async list() {
    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1 })
      .select("_id slug name imageUrl parentId")
      .lean();
    return categories.map(toSummary);
  },

  async getBySlug(slug: string) {
    const category = await Category.findOne({ slug, isActive: true })
      .select("_id slug name imageUrl parentId")
      .lean();
    if (!category) {
      throw new ApiError(404, "Category not found");
    }
    return toSummary(category);
  },
};
