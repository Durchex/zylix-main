import { withRoute, readJson } from "@/server/http/route";
import { enforceRateLimit, publicFormRateLimit } from "@/server/http/rateLimit";
import { newsletterService } from "@/server/services/newsletter.service";
import { unsubscribeSchema } from "@/server/validation/newsletter.schema";

export const POST = withRoute(async (req) => {
  await enforceRateLimit(req, publicFormRateLimit);
  const input = unsubscribeSchema.parse(await readJson(req));
  await newsletterService.unsubscribe(input.email);
  return { message: "Unsubscribed successfully." };
});
