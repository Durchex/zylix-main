import { withRoute } from "@/server/http/route";
import { categoryService } from "@/server/services/category.service";

export const GET = withRoute(async (_req, { params }) => {
  const category = await categoryService.getBySlug(params.slug);
  return { category };
});
