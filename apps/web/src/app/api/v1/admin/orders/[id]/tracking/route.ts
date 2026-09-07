import { withRoute, readJson } from "@/server/http/route";
import { requireRole } from "@/server/http/auth";
import { adminOrderService } from "@/server/services/admin/order.service";
import { updateOrderTrackingSchema } from "@/server/validation/admin/order.schema";

export const PATCH = withRoute(async (req, { params }) => {
  requireRole(req, "ADMIN");
  const input = updateOrderTrackingSchema.parse(await readJson(req));
  const order = await adminOrderService.updateTracking(params.id, input);
  return { order };
});
