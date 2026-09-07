import { withRoute, readJson } from "@/server/http/route";
import { enforceRateLimit, publicFormRateLimit } from "@/server/http/rateLimit";
import { supportService } from "@/server/services/support.service";
import { contactMessageSchema } from "@/server/validation/support.schema";

export const POST = withRoute(
  async (req) => {
    await enforceRateLimit(req, publicFormRateLimit);
    const input = contactMessageSchema.parse(await readJson(req));
    await supportService.submitContactMessage(input);
    return { message: "Your message has been received." };
  },
  { status: 201 },
);
