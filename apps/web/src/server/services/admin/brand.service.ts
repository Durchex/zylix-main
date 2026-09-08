import "server-only";
import { Types } from "mongoose";
import { ApiError } from "@/server/http/errors";
import { equalsInsensitive } from "@/server/lib/query";
import { Brand, Product, type BrandDoc } from "@/server/models";
import type { CreateBrandInput, UpdateBrandInput } from "@/server/validation/admin/brand.schema";

function toDto(brand: BrandDoc, productCount: number) {
  return {
    ...brand,
    id: String(brand._id),
    _count: { products: productCount },
  };
}

/**
 * Products reference a brand by name, not by id, so "how many products use
 * this brand" is a name match rather than a foreign-key lookup.
 */
function countProductsForBrand(name: string) {
  return Product.countDocuments({ brand: equalsInsensitive(name) });
}

export const adminBrandService = {
  async list() {
    const brands = await Brand.find().sort({ sortOrder: 1, name: 1 }).lean<BrandDoc[]>();

    // One grouped pass over products rather than a count query per brand.
    const counts = await Product.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$brand", count: { $sum: 1 } } },
    ]);
    const countByName = new Map(counts.map((c) => [String(c._id).toLowerCase(), c.count]));

    return brands.map((brand) => toDto(brand, countByName.get(brand.name.toLowerCase()) ?? 0));
  },

  async create(input: CreateBrandInput) {
    const [existingSlug, existingName] = await Promise.all([
      Brand.findOne({ slug: input.slug }).lean(),
      Brand.findOne({ name: equalsInsensitive(input.name) }).lean(),
    ]);
    if (existingSlug) throw new ApiError(409, "A brand with this slug already exists");
    if (existingName) throw new ApiError(409, "A brand with this name already exists");

    const created = await Brand.create(input);
    return toDto(created.toObject() as BrandDoc, 0);
  },

  async update(id: string, input: UpdateBrandInput) {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(404, "Brand not found");
    }
    const existing = await Brand.findById(id).lean<BrandDoc>();
    if (!existing) {
      throw new ApiError(404, "Brand not found");
    }

    if (input.slug && input.slug !== existing.slug) {
      const slugTaken = await Brand.findOne({ slug: input.slug }).lean();
      if (slugTaken) throw new ApiError(409, "A brand with this slug already exists");
    }
    if (input.name && input.name.toLowerCase() !== existing.name.toLowerCase()) {
      const nameTaken = await Brand.findOne({ name: equalsInsensitive(input.name) }).lean();
      if (nameTaken) throw new ApiError(409, "A brand with this name already exists");
    }

    const updated = await Brand.findByIdAndUpdate(id, input, { new: true }).lean<BrandDoc>();
    const productCount = await countProductsForBrand((updated as BrandDoc).name);
    return toDto(updated as BrandDoc, productCount);
  },

  async delete(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(404, "Brand not found");
    }
    const existing = await Brand.findById(id).lean<BrandDoc>();
    if (!existing) {
      throw new ApiError(404, "Brand not found");
    }

    // Deleting a brand that products still carry would leave those products
    // with a name no longer offered in the dropdown — block it the same way
    // deleting an in-use category is blocked.
    const productCount = await countProductsForBrand(existing.name);
    if (productCount > 0) {
      throw new ApiError(400, "Cannot delete a brand that still has products assigned");
    }

    await Brand.deleteOne({ _id: id });
  },
};
