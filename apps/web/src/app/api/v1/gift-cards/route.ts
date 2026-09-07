import { withRoute, readJson } from "@/server/http/route";
import { attachUserIfPresent } from "@/server/http/auth";
import { enforceRateLimit, publicFormRateLimit } from "@/server/http/rateLimit";
import { giftCardService } from "@/server/services/giftCard.service";
import { purchaseGiftCardSchema } from "@/server/validation/giftCard.schema";

export const POST = withRoute(
  async (req) => {
    await enforceRateLimit(req, publicFormRateLimit);
    const user = attachUserIfPresent(req);
    const input = purchaseGiftCardSchema.parse(await readJson(req));
    return giftCardService.initiatePurchase(user?.id ?? null, input);
  },
  { status: 201 },
);
