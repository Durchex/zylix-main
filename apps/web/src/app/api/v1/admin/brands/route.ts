import { withRoute, readJson } from "@/server/http/route";
import { requireRole } from "@/server/http/auth";
import { adminBrandService } from "@/server/services/admin/brand.service";
import { createBrandSchema } from "@/server/validation/admin/brand.schema";

export const GET = withRoute(async (req) => {
  requireRole(req, "ADMIN");
  const brands = await adminBrandService.list();
  return { brands };
});

export const POST = withRoute(
  async (req) => {
    requireRole(req, "ADMIN");
    const input = createBrandSchema.parse(await readJson(req));
    const brand = await adminBrandService.create(input);
    return { brand };
  },
  { status: 201 },
);
