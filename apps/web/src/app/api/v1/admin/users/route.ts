import { withRoute, readQuery } from "@/server/http/route";
import { requireRole } from "@/server/http/auth";
import { adminUserService } from "@/server/services/admin/user.service";
import { adminUserListQuerySchema } from "@/server/validation/admin/user.schema";

export const GET = withRoute(async (req) => {
  requireRole(req, "ADMIN");
  const query = adminUserListQuerySchema.parse(readQuery(req));
  return adminUserService.list(query);
});
