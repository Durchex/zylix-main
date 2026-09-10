import { withRoute, readQuery } from "@/server/http/route";
import { enforceRateLimit, publicFormRateLimit } from "@/server/http/rateLimit";
import { placesService, isPlacesConfigured } from "@/server/lib/places";

export const GET = withRoute(async (req) => {
  // Each keystroke can reach here, and every call bills Google — the limiter
  // is what stops an open endpoint turning into someone else's quota.
  await enforceRateLimit(req, publicFormRateLimit);

  const { q } = readQuery(req);
  // Below a couple of characters the predictions are noise and the call is
  // wasted spend.
  if (!q || q.trim().length < 3) return { suggestions: [] };

  // Not configured is a normal state, not an error — the address form falls
  // back to manual entry.
  if (!isPlacesConfigured()) return { suggestions: [], available: false };

  const suggestions = await placesService.autocomplete(q.trim());
  return { suggestions, available: true };
});
