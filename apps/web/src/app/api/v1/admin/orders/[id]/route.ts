import { withRoute } from "@/server/http/route";
import { requireRole } from "@/server/http/auth";
import { adminOrderService } from "@/server/services/admin/order.service";

export const GET = withRoute(async (req, { params }) => {
  requireRole(req, "ADMIN");
  const order = await adminOrderService.getById(params.id);
  return { order };
});
