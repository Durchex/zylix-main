import { withRoute, readJson } from "@/server/http/route";
import { requireRole } from "@/server/http/auth";
import { adminCategoryService } from "@/server/services/admin/category.service";
import { createCategorySchema } from "@/server/validation/admin/category.schema";

export const GET = withRoute(async (req) => {
  requireRole(req, "ADMIN");
  const categories = await adminCategoryService.list();
  return { categories };
});

export const POST = withRoute(
  async (req) => {
    requireRole(req, "ADMIN");
    const input = createCategorySchema.parse(await readJson(req));
    const category = await adminCategoryService.create(input);
    return { category };
  },
  { status: 201 },
);
