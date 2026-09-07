import { withRoute, readJson } from "@/server/http/route";
import { requireRole } from "@/server/http/auth";
import { adminProductService } from "@/server/services/admin/product.service";
import { bulkCreateProductSchema } from "@/server/validation/admin/product.schema";

export const POST = withRoute(
  async (req) => {
    requireRole(req, "ADMIN");
    const input = bulkCreateProductSchema.parse(await readJson(req));
    return adminProductService.bulkCreate(input.products);
  },
  { status: 207 },
);
