import { withRoute, readQuery } from "@/server/http/route";
import { requireRole } from "@/server/http/auth";
import { adminOrderService } from "@/server/services/admin/order.service";
import { adminOrderListQuerySchema } from "@/server/validation/admin/order.schema";

export const GET = withRoute(async (req) => {
  requireRole(req, "ADMIN");
  const query = adminOrderListQuerySchema.parse(readQuery(req));
  return adminOrderService.list(query);
});
