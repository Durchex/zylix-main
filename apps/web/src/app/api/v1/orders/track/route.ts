import { withRoute, readQuery } from "@/server/http/route";
import { orderService } from "@/server/services/order.service";
import { orderTrackingQuerySchema } from "@/server/validation/order.schema";

export const GET = withRoute(async (req) => {
  const query = orderTrackingQuerySchema.parse(readQuery(req));
  const order = await orderService.track(query.orderNumber, query.email);
  return { order };
});
