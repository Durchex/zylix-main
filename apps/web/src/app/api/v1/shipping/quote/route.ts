import { withRoute, readQuery } from "@/server/http/route";
import { shippingService } from "@/server/services/shipping.service";
import { shippingQuoteQuerySchema } from "@/server/validation/shipping.schema";

export const GET = withRoute(async (req) => {
  const query = shippingQuoteQuerySchema.parse(readQuery(req));
  const quote = await shippingService.getQuote(query.state, query.subtotal);
  return { quote };
});
