import { withRoute, readQuery } from "@/server/http/route";
import { enforceRateLimit, publicFormRateLimit } from "@/server/http/rateLimit";
import { ApiError } from "@/server/http/errors";
import { placesService } from "@/server/lib/places";

export const GET = withRoute(async (req) => {
  await enforceRateLimit(req, publicFormRateLimit);

  const { placeId } = readQuery(req);
  if (!placeId) throw new ApiError(422, "placeId is required");

  const place = await placesService.details(placeId);
  return { place };
});
