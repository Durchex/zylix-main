import { withRoute } from "@/server/http/route";
import { blogService } from "@/server/services/blog.service";

export const GET = withRoute(async (_req, { params }) => {
  const post = await blogService.getBySlug(params.slug);
  return { post };
});
