import { withRoute, readJson } from "@/server/http/route";
import { enforceRateLimit, publicFormRateLimit } from "@/server/http/rateLimit";
import { newsletterService } from "@/server/services/newsletter.service";
import { subscribeSchema } from "@/server/validation/newsletter.schema";

export const POST = withRoute(
  async (req) => {
    await enforceRateLimit(req, publicFormRateLimit);
    const input = subscribeSchema.parse(await readJson(req));
    await newsletterService.subscribe(input.email);
    return { message: "Subscribed successfully." };
  },
  { status: 201 },
);
