import { Types } from "mongoose";
import { withRoute, readJson } from "@/server/http/route";
import { attachUserIfPresent } from "@/server/http/auth";
import { enforceRateLimit, publicFormRateLimit } from "@/server/http/rateLimit";
import { ApiError } from "@/server/http/errors";
import { logisticsService } from "@/server/services/logistics";
import { shippingService } from "@/server/services/shipping.service";
import { Address, User, type AddressDoc } from "@/server/models";
import { shippingRatesSchema } from "@/server/validation/order.schema";

/**
 * Courier options for a cart going to a given destination.
 *
 * Open to guests (checkout doesn't require an account), but rate-limited —
 * every call costs a live Shipbubble request.
 *
 * When logistics isn't configured, or no courier serves the route, this
 * returns the flat-rate ShippingZone quote instead so checkout still works.
 */
export const POST = withRoute(async (req) => {
  await enforceRateLimit(req, publicFormRateLimit);

  const user = attachUserIfPresent(req);
  const input = shippingRatesSchema.parse(await readJson(req));

  // A saved address is re-read from the database and ownership-checked; only
  // its id is trusted from the request.
  let address: AddressDoc;
  if (input.addressId) {
    if (!user) throw new ApiError(401, "Sign in to use a saved address");
    if (!Types.ObjectId.isValid(input.addressId)) {
      throw new ApiError(404, "That address could not be found");
    }
    const saved = await Address.findById(input.addressId).lean<AddressDoc>();
    if (!saved || String(saved.userId) !== user.id) {
      throw new ApiError(404, "That address could not be found");
    }
    address = saved;
  } else {
    // Not persisted — this is a quote for an address still being typed in.
    address = { ...input.shippingAddress, _id: new Types.ObjectId() } as unknown as AddressDoc;
  }

  const customerEmail =
    address.email ??
    input.shippingAddress?.email ??
    (user ? ((await User.findById(user.id).select("email").lean())?.email ?? "") : "");

  if (!customerEmail) {
    throw new ApiError(422, "An email address is required to quote delivery");
  }

  const quote = await logisticsService.quoteCouriers({
    items: input.items,
    address,
    customerEmail,
    userId: user?.id ?? null,
  });

  if (quote) {
    return { couriers: quote.couriers, requestToken: quote.requestToken, source: "shipbubble" };
  }

  // Fallback: one synthetic "standard delivery" option built from the flat
  // rate, so the checkout UI has a single shape to render either way.
  const flat = await shippingService.getQuote(address.state, 0);
  return {
    couriers: [
      {
        courierId: "standard",
        courierName: flat.zoneName,
        serviceCode: "standard",
        total: flat.fee,
        currency: "NGN",
        deliveryEta: `${flat.estimatedDaysMin}–${flat.estimatedDaysMax} business days`,
      },
    ],
    requestToken: null,
    source: "flat-rate",
  };
});
