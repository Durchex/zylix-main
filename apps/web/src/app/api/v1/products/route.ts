import { withRoute, readQuery } from "@/server/http/route";
import { productService } from "@/server/services/product.service";
import { productListQuerySchema } from "@/server/validation/product.schema";

export const GET = withRoute(async (req) => {
  const query = productListQuerySchema.parse(readQuery(req));
  return productService.list(query);
});
