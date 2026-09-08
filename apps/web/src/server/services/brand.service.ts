import "server-only";
import { ApiError } from "@/server/http/errors";
import { Brand } from "@/server/models";

interface BrandSummary {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  description: string | null;
}

function toSummary(brand: {
  _id: unknown;
  slug: string;
  name: string;
  logoUrl?: string | null;
  description?: string | null;
}): BrandSummary {
  return {
    id: String(brand._id),
    slug: brand.slug,
    name: brand.name,
    logoUrl: brand.logoUrl ?? null,
    description: brand.description ?? null,
  };
}

export const brandService = {
  async list() {
    const brands = await Brand.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .select("_id slug name logoUrl description")
      .lean();
    return brands.map(toSummary);
  },

  async getBySlug(slug: string) {
    const brand = await Brand.findOne({ slug, isActive: true })
      .select("_id slug name logoUrl description")
      .lean();
    if (!brand) {
      throw new ApiError(404, "Brand not found");
    }
    return toSummary(brand);
  },
};
