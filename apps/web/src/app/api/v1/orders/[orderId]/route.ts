import { withRoute } from "@/server/http/route";
import { orderService } from "@/server/services/order.service";

export const GET = withRoute(async (_req, { params }) => {
  const order = await orderService.getConfirmation(params.orderId);
  return { order };
});
