import "server-only";
import { getEnv } from "@/server/config/env";
import { ApiError } from "@/server/http/errors";

/**
 * Google Places, proxied server-side.
 *
 * The key is never sent to the browser: a Places key embedded in client code
 * can be lifted off any page and spent against the account, and restricting
 * it by HTTP referrer only narrows that rather than closing it. Proxying also
 * keeps the key in the same server-only env contract as everything else.
 */
export function isPlacesConfigured(): boolean {
  return Boolean(getEnv().GOOGLE_MAPS_API_KEY);
}

function requireKey(): string {
  const key = getEnv().GOOGLE_MAPS_API_KEY;
  if (!key) {
    throw new ApiError(503, "Address search is not configured on this environment");
  }
  return key;
}

export interface PlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface PlaceDetail {
  placeId: string;
  formattedAddress: string;
  line1: string;
  city: string;
  state: string;
  country: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface AutocompleteResponse {
  status: string;
  error_message?: string;
  predictions?: Array<{
    place_id: string;
    description: string;
    structured_formatting?: { main_text?: string; secondary_text?: string };
  }>;
}

interface DetailsResponse {
  status: string;
  error_message?: string;
  result?: {
    place_id: string;
    formatted_address: string;
    address_components?: Array<{ long_name: string; short_name: string; types: string[] }>;
    geometry?: { location?: { lat: number; lng: number } };
  };
}

async function googleRequest<T extends { status: string; error_message?: string }>(
  url: string,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  } catch (err) {
    console.error("[places] request failed", { error: err instanceof Error ? err.message : err });
    throw new ApiError(502, "Address search is unavailable right now.");
  }

  const payload = (await response.json().catch(() => null)) as T | null;
  if (!payload) throw new ApiError(502, "Address search is unavailable right now.");

  // ZERO_RESULTS is a legitimate empty answer, not a failure.
  if (payload.status !== "OK" && payload.status !== "ZERO_RESULTS") {
    console.error("[places] error status", { status: payload.status, message: payload.error_message });
    throw new ApiError(502, "Address search is unavailable right now.");
  }

  return payload;
}

export const placesService = {
  async autocomplete(query: string, country = "ng"): Promise<PlaceSuggestion[]> {
    const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
    url.searchParams.set("input", query);
    url.searchParams.set("key", requireKey());
    // Deliveries are domestic, so restricting results keeps the list relevant
    // and avoids quoting couriers for addresses they can't serve.
    url.searchParams.set("components", `country:${country}`);

    const data = await googleRequest<AutocompleteResponse>(url.toString());
    return (data.predictions ?? []).map((p) => ({
      placeId: p.place_id,
      description: p.description,
      mainText: p.structured_formatting?.main_text ?? p.description,
      secondaryText: p.structured_formatting?.secondary_text ?? "",
    }));
  },

  async details(placeId: string): Promise<PlaceDetail> {
    const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    url.searchParams.set("place_id", placeId);
    url.searchParams.set("key", requireKey());
    url.searchParams.set("fields", "place_id,formatted_address,address_components,geometry");

    const data = await googleRequest<DetailsResponse>(url.toString());
    const result = data.result;
    if (!result) throw new ApiError(404, "That address could not be found.");

    const components = result.address_components ?? [];
    const find = (type: string) => components.find((c) => c.types.includes(type));

    // Street number and route make up the street line; Google returns them
    // separately and neither is guaranteed to be present.
    const streetNumber = find("street_number")?.long_name;
    const route = find("route")?.long_name;
    const line1 =
      [streetNumber, route].filter(Boolean).join(" ") ||
      find("neighborhood")?.long_name ||
      result.formatted_address.split(",")[0]!;

    return {
      placeId: result.place_id,
      formattedAddress: result.formatted_address,
      line1,
      city:
        find("locality")?.long_name ??
        find("administrative_area_level_2")?.long_name ??
        "",
      state: find("administrative_area_level_1")?.long_name ?? "",
      country: find("country")?.long_name ?? "Nigeria",
      postalCode: find("postal_code")?.long_name ?? null,
      latitude: result.geometry?.location?.lat ?? null,
      longitude: result.geometry?.location?.lng ?? null,
    };
  },
};
