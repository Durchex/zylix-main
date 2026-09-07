import { withRoute } from "@/server/http/route";
import { requireRole } from "@/server/http/auth";
import { adminUserService } from "@/server/services/admin/user.service";

export const GET = withRoute(async (req, { params }) => {
  requireRole(req, "ADMIN");
  const user = await adminUserService.getById(params.id);
  return { user };
});
