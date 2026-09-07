import { withRoute, readJson, readQuery } from "@/server/http/route";
import { requireRole } from "@/server/http/auth";
import { adminProductService } from "@/server/services/admin/product.service";
import { adminProductListQuerySchema, createProductSchema } from "@/server/validation/admin/product.schema";

export const GET = withRoute(async (req) => {
  requireRole(req, "ADMIN");
  const query = adminProductListQuerySchema.parse(readQuery(req));
  return adminProductService.list(query);
});

export const POST = withRoute(
  async (req) => {
    requireRole(req, "ADMIN");
    const input = createProductSchema.parse(await readJson(req));
    const product = await adminProductService.create(input);
    return { product };
  },
  { status: 201 },
);
