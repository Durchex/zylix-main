import "server-only";
import { Types } from "mongoose";
import { ApiError } from "@/server/http/errors";
import { Category, Product } from "@/server/models";

interface CategorySummary {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  parentId: string | null;
  /** Active products in this category — drives the listing filter counts. */
  productCount: number;
}

function toSummary(
  category: {
    _id: unknown;
    slug: string;
    name: string;
    imageUrl?: string | null;
    parentId?: unknown;
  },
  productCount = 0,
): CategorySummary {
  return {
    id: String(category._id),
    slug: category.slug,
    name: category.name,
    imageUrl: category.imageUrl ?? null,
    parentId: category.parentId ? String(category.parentId) : null,
    productCount,
  };
}

/**
 * Active-product counts per category, in one grouped query rather than one
 * count per category — the filter sidebar renders every category at once.
 */
async function countActiveProductsByCategory(categoryIds: unknown[]) {
  const counts = await Product.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { status: "ACTIVE", categoryId: { $in: categoryIds } } },
    { $group: { _id: "$categoryId", count: { $sum: 1 } } },
  ]);
  return new Map(counts.map((c) => [String(c._id), c.count]));
}

export const categoryService = {
  async list() {
    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1 })
      .select("_id slug name imageUrl parentId")
      .lean();

    const countByCategory = await countActiveProductsByCategory(categories.map((c) => c._id));

    return categories.map((c) => toSummary(c, countByCategory.get(String(c._id)) ?? 0));
  },

  async getBySlug(slug: string) {
    const category = await Category.findOne({ slug, isActive: true })
      .select("_id slug name imageUrl parentId")
      .lean();
    if (!category) {
      throw new ApiError(404, "Category not found");
    }

    const productCount = await Product.countDocuments({ status: "ACTIVE", categoryId: category._id });
    return toSummary(category, productCount);
  },
};
