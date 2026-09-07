import { withRoute, readJson, readQuery } from "@/server/http/route";
import { requireRole } from "@/server/http/auth";
import { adminBlogService } from "@/server/services/admin/blog.service";
import { adminBlogListQuerySchema, createBlogPostSchema } from "@/server/validation/admin/blog.schema";

export const GET = withRoute(async (req) => {
  requireRole(req, "ADMIN");
  const query = adminBlogListQuerySchema.parse(readQuery(req));
  return adminBlogService.list(query);
});

export const POST = withRoute(
  async (req) => {
    const admin = requireRole(req, "ADMIN");
    const input = createBlogPostSchema.parse(await readJson(req));
    const post = await adminBlogService.create(admin.id, input);
    return { post };
  },
  { status: 201 },
);
