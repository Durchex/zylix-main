import { withRoute, readQuery } from "@/server/http/route";
import { blogService } from "@/server/services/blog.service";
import { blogListQuerySchema } from "@/server/validation/blog.schema";

export const GET = withRoute(async (req) => {
  const query = blogListQuerySchema.parse(readQuery(req));
  return blogService.list(query);
});
