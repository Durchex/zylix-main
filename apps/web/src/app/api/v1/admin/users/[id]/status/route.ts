import { withRoute, readJson } from "@/server/http/route";
import { requireRole } from "@/server/http/auth";
import { adminUserService } from "@/server/services/admin/user.service";
import { updateUserStatusSchema } from "@/server/validation/admin/user.schema";

export const PATCH = withRoute(async (req, { params }) => {
  const admin = requireRole(req, "ADMIN");
  const input = updateUserStatusSchema.parse(await readJson(req));
  const user = await adminUserService.updateStatus(params.id, input, admin.id);
  return { user };
});
