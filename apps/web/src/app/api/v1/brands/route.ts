import { withRoute } from "@/server/http/route";
import { brandService } from "@/server/services/brand.service";

/**
 * Public list of admin-managed brands — what the product form's Brand
 * dropdown reads. Distinct from /products/brands, which reports the brand
 * names actually assigned to products (with counts) for the listing filter.
 */
export const GET = withRoute(async () => {
  const brands = await brandService.list();
  return { brands };
});
