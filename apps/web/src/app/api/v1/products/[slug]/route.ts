import { withRoute } from "@/server/http/route";
import { productService } from "@/server/services/product.service";

export const GET = withRoute(async (_req, { params }) => {
  const product = await productService.getBySlug(params.slug);
  return { product };
});
