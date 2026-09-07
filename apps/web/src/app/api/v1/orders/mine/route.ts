import { withRoute, readQuery } from "@/server/http/route";
import { requireAuth } from "@/server/http/auth";
import { orderService } from "@/server/services/order.service";
import { myOrderListQuerySchema } from "@/server/validation/order.schema";

export const GET = withRoute(async (req) => {
  const user = requireAuth(req);
  const query = myOrderListQuerySchema.parse(readQuery(req));
  return orderService.listMine(user.id, query);
});
