import { withRoute } from "@/server/http/route";
import { categoryService } from "@/server/services/category.service";

export const GET = withRoute(async () => {
  const categories = await categoryService.list();
  return { categories };
});
