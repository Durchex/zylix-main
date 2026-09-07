import { withRoute } from "@/server/http/route";
import { requireAuth } from "@/server/http/auth";
import { orderService } from "@/server/services/order.service";

export const GET = withRoute(async (req, { params }) => {
  const user = requireAuth(req);
  const order = await orderService.getMineById(user.id, params.orderId);
  return { order };
});
