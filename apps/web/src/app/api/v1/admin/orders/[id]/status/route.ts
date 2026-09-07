import { withRoute, readJson } from "@/server/http/route";
import { requireRole } from "@/server/http/auth";
import { adminOrderService } from "@/server/services/admin/order.service";
import { updateOrderStatusSchema } from "@/server/validation/admin/order.schema";

export const PATCH = withRoute(async (req, { params }) => {
  const admin = requireRole(req, "ADMIN");
  const input = updateOrderStatusSchema.parse(await readJson(req));
  const order = await adminOrderService.updateStatus(params.id, input, admin.id);
  return { order };
});
