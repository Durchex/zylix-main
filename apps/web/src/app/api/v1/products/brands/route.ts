import { withRoute } from "@/server/http/route";
import { Product } from "@/server/models";

/**
 * ZylixStore sells its own catalog across many manufacturer brands (Product.
 * brand — "Samsung", "Apple", ...); it isn't a multi-vendor marketplace, so
 * this replaces what used to be a seller directory. Distinct brand names
 * among active products, each with how many products carry it.
 */
export const GET = withRoute(async () => {
  const brands = await Product.aggregate<{ _id: string; count: number }>([
    { $match: { status: "ACTIVE" } },
    { $group: { _id: "$brand", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  return { brands: brands.map((b) => ({ name: b._id, productCount: b.count })) };
});
