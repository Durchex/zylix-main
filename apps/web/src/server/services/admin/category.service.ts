import "server-only";
import { Types } from "mongoose";
import { ApiError } from "@/server/http/errors";
import { Category, Product, type CategoryDoc } from "@/server/models";

function toDto(category: CategoryDoc, productCount: number) {
  return {
    ...category,
    id: String(category._id),
    parentId: category.parentId ? String(category.parentId) : null,
    _count: { products: productCount },
  };
}

export const adminCategoryService = {
  async list() {
    const categories = await Category.find().sort({ sortOrder: 1 }).lean<CategoryDoc[]>();

    // Prisma's `_count: { select: { products } }` did this join in the
    // database; a single grouped count query replaces the per-row count.
    const counts = await Product.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { categoryId: { $in: categories.map((c) => c._id) } } },
      { $group: { _id: "$categoryId", count: { $sum: 1 } } },
    ]);
    const countByCategory = new Map(counts.map((c) => [String(c._id), c.count]));

    return categories.map((c) => toDto(c, countByCategory.get(String(c._id)) ?? 0));
  },

  async create(input: {
    name: string;
    slug: string;
    description?: string;
    imageUrl?: string;
    parentId?: string | null;
    isActive: boolean;
    sortOrder: number;
    seoTitle?: string;
    seoDescription?: string;
  }) {
    const existing = await Category.findOne({ slug: input.slug }).lean();
    if (existing) {
      throw new ApiError(409, "A category with this slug already exists");
    }
    const created = await Category.create(input);
    return toDto(created.toObject() as CategoryDoc, 0);
  },

  async update(id: string, input: Partial<Parameters<typeof adminCategoryService.create>[0]>) {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(404, "Category not found");
    }
    const existing = await Category.findById(id).lean<CategoryDoc>();
    if (!existing) {
      throw new ApiError(404, "Category not found");
    }
    if (input.slug && input.slug !== existing.slug) {
      const slugTaken = await Category.findOne({ slug: input.slug }).lean();
      if (slugTaken) throw new ApiError(409, "A category with this slug already exists");
    }
    if (input.parentId === id) {
      throw new ApiError(400, "A category cannot be its own parent");
    }

    const updated = await Category.findByIdAndUpdate(id, input, { new: true }).lean<CategoryDoc>();
    const productCount = await Product.countDocuments({ categoryId: id });
    return toDto(updated as CategoryDoc, productCount);
  },

  async delete(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(404, "Category not found");
    }
    const existing = await Category.findById(id).lean();
    if (!existing) {
      throw new ApiError(404, "Category not found");
    }

    const [productCount, childCount] = await Promise.all([
      Product.countDocuments({ categoryId: id }),
      Category.countDocuments({ parentId: id }),
    ]);
    if (productCount > 0) {
      throw new ApiError(400, "Cannot delete a category that still has products assigned");
    }
    if (childCount > 0) {
      throw new ApiError(400, "Cannot delete a category that has subcategories");
    }

    await Category.deleteOne({ _id: id });
  },
};
