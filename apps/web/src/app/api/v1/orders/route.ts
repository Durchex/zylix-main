import { withRoute, readJson } from "@/server/http/route";
import { requireAuth } from "@/server/http/auth";
import { orderService } from "@/server/services/order.service";
import { createOrderSchema } from "@/server/validation/order.schema";

export const POST = withRoute(
  async (req) => {
    const user = requireAuth(req);
    const input = createOrderSchema.parse(await readJson(req));
    return orderService.createOrder(user.id, input);
  },
  { status: 201 },
);
